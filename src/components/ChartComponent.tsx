import { AreaSeries, createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { ActionPoint } from './ActionPoint';

export const ChartComponent = props => {
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
      height: 300,
    });
    chart.timeScale().fitContent();

    const newSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });
    newSeries.setData(data);

    const point = {
      time: '2018-12-23',
      price: 32.51,
    };

    const actionPoint = new ActionPoint(chart, newSeries, point, { type: "Sell" });
    newSeries.attachPrimitive(actionPoint);

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
