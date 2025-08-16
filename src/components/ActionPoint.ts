import type {
  BitmapCoordinatesRenderingScope,
  CanvasRenderingTarget2D,
} from 'fancy-canvas';
import type {
  Coordinate,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  SeriesOptionsMap,
  SeriesType,
  Time,
} from 'lightweight-charts';

const fontSize = 18;

interface ViewPoint {
  x: Coordinate | null;
  y: Coordinate | null;
}

interface Point {
  time: Time;
  price: number;
}

class ActionPointPaneRenderer implements IPrimitivePaneRenderer {
  _p1: ViewPoint;
  text: string;
  _options: ActionPointOptions;

  constructor(p1: ViewPoint, text1: string, options: ActionPointOptions) {
    this._p1 = p1;
    this.text = text1;
    this._options = options;
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace(scope => {
      if (this._p1.x === null || this._p1.y === null) return;

      const ctx = scope.context;
      const x1Scaled = Math.round(this._p1.x * scope.horizontalPixelRatio);
      const y1Scaled = Math.round(this._p1.y * scope.verticalPixelRatio);
      const textYScaled = Math.round(
        (this._p1.y + fontSize / 2 - this._options.lineWidth / 2) *
          scope.verticalPixelRatio
      );

      const x1 = Math.round(
        (this._p1.x - this._options.width / 2) * scope.horizontalPixelRatio
      );
      const x2 = Math.round(
        (this._p1.x + this._options.width / 2) * scope.horizontalPixelRatio
      );

      ctx.lineWidth = this._options.lineWidth;
      ctx.strokeStyle = this._options.lineColor;

      ctx.beginPath();
      ctx.moveTo(x1, y1Scaled);
      ctx.lineTo(x2, y1Scaled);
      ctx.stroke();

      if (this._options.showLabels) {
        this._drawTextLabel(scope, this.text, x1Scaled, textYScaled, true);
      }
    });
  }

  _drawTextLabel(
    scope: BitmapCoordinatesRenderingScope,
    text: string,
    x: number,
    y: number,
    left: boolean
  ) {
    scope.context.font = fontSize + 'px Arial';
    scope.context.beginPath();

    const offset = 5 * scope.horizontalPixelRatio;
    const textWidth = scope.context.measureText(text);
    const leftAdjustment = left
      ? textWidth.width + offset * 4 + this._options.width / 2
      : -this._options.width / 2;

    scope.context.fillStyle = this._options.labelBackgroundColor;
    scope.context.roundRect(
      x + offset - leftAdjustment,
      y - fontSize,
      textWidth.width + offset * 2,
      fontSize + offset,
      2
    );
    scope.context.fill();
    scope.context.beginPath();
    scope.context.fillStyle = this._options.labelTextColor;
    scope.context.fillText(text, x + offset * 2 - leftAdjustment, y);
  }
}

class ActionPointPaneView implements IPrimitivePaneView {
  _source: ActionPoint;
  _p1: ViewPoint = { x: null, y: null };

  constructor(source: ActionPoint) {
    this._source = source;
  }

  update() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source._p1.price);

    const timeScale = this._source._chart.timeScale();

    const x1 = timeScale.timeToCoordinate(this._source._p1.time);
    this._p1 = { x: x1, y: y1 };
  }

  renderer() {
    return new ActionPointPaneRenderer(
      this._p1,
      '' + this._source._p1.price.toFixed(1),
      this._source._options
    );
  }
}

const defaultOptions: ActionPointOptions = {
  width: 20,
  showLabels: true,
  labelBackgroundColor: 'rgba(255, 255, 255, 0.85)',
  labelTextColor: 'rgb(0, 0, 0)',
  lineColor: 'rgb(255, 0, 0)',
  lineWidth: 4,
};

export interface ActionPointOptions {
  lineColor: string;
  width: number;
  showLabels: boolean;
  labelBackgroundColor: string;
  labelTextColor: string;
  lineWidth: number;
}

export class ActionPoint implements ISeriesPrimitive<Time> {
  _chart: IChartApi;
  _series: ISeriesApi<keyof SeriesOptionsMap>;
  _p1: Point;
  _paneViews: ActionPointPaneView[];
  _options: ActionPointOptions;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<SeriesType>,
    p1: Point,
    options?: Partial<ActionPointOptions>
  ) {
    this._chart = chart;
    this._series = series;
    this._p1 = p1;
    this._options = {
      ...defaultOptions,
      ...options,
    };
    this._paneViews = [new ActionPointPaneView(this)];
  }

  updateAllViews() {
    this._paneViews.forEach(pw => pw.update());
  }

  paneViews() {
    return this._paneViews;
  }

  _pointIndex(p: Point): number | null {
    const coordinate = this._chart.timeScale().timeToCoordinate(p.time);
    if (coordinate === null) return null;
    const index = this._chart.timeScale().coordinateToLogical(coordinate);
    return index;
  }
}
