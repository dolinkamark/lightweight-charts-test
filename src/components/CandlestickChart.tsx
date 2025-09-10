import {
  createChart,
  ColorType,
  CandlestickSeries,
  type Time,
  type IChartApi,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { ActionPoint } from './ActionPoint';
import { setPriceAxis } from '../helpers/chart.helpers';

// Function to zoom chart to a specific range of candles
const zoomToCandleRange = (
  chart: IChartApi,
  data: any[],
  startIndex: number,
  endIndex: number
) => {
  if (!data || data.length === 0 || startIndex < 0 || endIndex >= data.length || startIndex >= endIndex) {
    console.warn('Invalid candle range for zooming:', { startIndex, endIndex, dataLength: data.length });
    return;
  }

  const startTime = data[startIndex].time;
  const endTime = data[endIndex].time;

  let highestHigh = data[startIndex].high;
  let lowestLow = data[startIndex].low;
  
  for (let i = startIndex; i <= endIndex; i++) {
    if (data[i].high > highestHigh) {
      highestHigh = data[i].high;
    }
    if (data[i].low < lowestLow) {
      lowestLow = data[i].low;
    }
  }

  // Use requestAnimationFrame to ensure the chart is fully rendered before zooming
  requestAnimationFrame(() => {
    chart.timeScale().setVisibleRange({
      from: startTime,
      to: endTime,
    });
    
    setPriceRangeWithPadding(chart, lowestLow, highestHigh);
  });
};

const setPriceRangeWithPadding = (
  chart: IChartApi,
  startPrice: number,
  endPrice: number
) => {
  if (!chart || startPrice >= endPrice) {
    return;
  }

  const priceRange = endPrice - startPrice;
  const totalRange = priceRange * 0.8;
  const rangeCenter = (startPrice + endPrice) / 2 - priceRange * 0.05;

  // Set the visible range with padding
  const visibleRange = {
    from: rangeCenter - totalRange / 2,
    to: rangeCenter + totalRange / 2
  };

  const priceScale = chart.priceScale('right');
  priceScale.setAutoScale(false);
  priceScale.setVisibleRange(visibleRange);
};

export const CandlestickChart = props => {
  const {
    data,
    colors: {
      backgroundColor = '#0F0F0F',
      lineColor = '#2962FF',
      gridLineColor = '#2C2C2C',
      textColor = '#9C9C9C',
      areaTopColor = '#2962FF',
      areaBottomColor = 'rgba(41, 98, 255, 0.28)',
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: {
          color: gridLineColor,
        },
        horzLines: {
          color: gridLineColor,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      }
    });

    const series = chart.addSeries(CandlestickSeries);
    series.setData(data);

    setPriceAxis(chart, series);

    const point = {
      time: (new Date("2025-08-12T10:40:00Z").getTime() / 1000) as Time,
      price: 181.05,
    };

    const actionPoint = new ActionPoint(chart, series, point, { type: "buy" });
    series.attachPrimitive(actionPoint);

    // Zoom to candles 5-15 (0-indexed, so indices 4-14) - call after all setup is complete
    zoomToCandleRange(chart, data, 20, 50);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [
    data,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
  ]);

  return <div ref={chartContainerRef} />;
};
