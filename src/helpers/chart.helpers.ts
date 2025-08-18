import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";

export function setPriceAxis(chart: IChartApi, series: ISeriesApi<"Candlestick", Time>) {
  const priceScale = chart.priceScale('right');
  priceScale.setAutoScale(false);

  const container = chart.chartElement();
  container.addEventListener('wheel', (e) => {
    const axisWidth = priceScale.width();
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const overAxis = x >= rect.width - axisWidth;

    if (!overAxis) return;

    e.stopPropagation();

    const y = e.clientY - rect.top;
    const centerPrice = series.coordinateToPrice(y) ?? 0;

    const vr = priceScale.getVisibleRange() || (() => {
      const top = series.coordinateToPrice(0) ?? 0;
      const bot = series.coordinateToPrice(rect.height) ?? 0;
      return { from: Math.min(top, bot), to: Math.max(top, bot) };
    })();

    const factor = e.deltaY < 0 ? 0.9 : 1.1;
    const fromDist = centerPrice - vr.from;
    const toDist = vr.to - centerPrice;

    const newRange = {
      from: centerPrice - fromDist * factor,
      to: centerPrice + toDist * factor,
    };

    priceScale.setVisibleRange(newRange);
  }, { passive: false, capture: true });
}