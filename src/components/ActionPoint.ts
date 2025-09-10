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

const fontSize = 14;
const buyColor = "#1CCA11";
const sellColor = "#E10011";

const buyTextColor = "#000000";
const sellTextColor = "#FAFAFA";

interface ViewPoint {
  x: Coordinate | null;
  y: Coordinate | null;
}

interface Point {
  time: Time;
  price: number;
}

class ActionPointPaneRenderer implements IPrimitivePaneRenderer {
  point: ViewPoint;
  text: string;
  _options: ActionPointOptions;

  constructor(point: ViewPoint, text1: string, options: ActionPointOptions) {
    this.point = point;
    this.text = text1;
    this._options = options;
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace(scope => {
      if (this.point.x === null || this.point.y === null) return;

      const ctx = scope.context;
      const x1Scaled = Math.round(this.point.x * scope.horizontalPixelRatio);
      const y1Scaled = Math.round(this.point.y * scope.verticalPixelRatio);
      const textYScaled = Math.round(
        (this.point.y + fontSize / 2 - this._options.lineWidth / 2) *
          scope.verticalPixelRatio
      );

      const x1 = Math.round(
        (this.point.x - this._options.width / 2) * scope.horizontalPixelRatio
      );
      const x2 = Math.round(
        (this.point.x + this._options.width / 2) * scope.horizontalPixelRatio
      );

      ctx.lineWidth = this._options.lineWidth;
      ctx.strokeStyle = this._options.type == "buy" ? buyColor : sellColor;

      ctx.beginPath();
      ctx.moveTo(x1, y1Scaled);
      ctx.lineTo(x2, y1Scaled);
      ctx.stroke();

      if (this._options.showLabels) {
        this._drawTextLabel(scope, this.text, x1Scaled, textYScaled, this._options.position);
      }
    });
  }

  _drawTextLabel(
    scope: BitmapCoordinatesRenderingScope,
    text: string,
    x: number,
    y: number,
    position: string
  ) {
    scope.context.font = fontSize + 'px Arial';
    scope.context.beginPath();

    const offset = 5 * scope.horizontalPixelRatio;
    const textWidth = scope.context.measureText(text);
    const sideAdjustment = position == "left"
      ? textWidth.width + offset * 4 + this._options.width / 2
      : -this._options.width / 2;

    scope.context.fillStyle = this._options.type == "buy" ? buyColor : sellColor;
    scope.context.roundRect(
      x + offset - sideAdjustment,
      y - fontSize,
      textWidth.width + offset * 2,
      fontSize + offset,
      2
    );

    scope.context.globalAlpha = 0.9;
    scope.context.fill();
    scope.context.globalAlpha = 1.0;

    scope.context.beginPath();
    scope.context.fillStyle = this._options.type == "buy" ? buyTextColor : sellTextColor;
    scope.context.fillText(text, x + offset * 2 - sideAdjustment, y);
  }
}

class ActionPointPaneView implements IPrimitivePaneView {
  _source: ActionPoint;
  point: ViewPoint = { x: null, y: null };

  constructor(source: ActionPoint) {
    this._source = source;
  }

  update() {
    const series = this._source._series;
    const y1 = series.priceToCoordinate(this._source.point.price);

    const timeScale = this._source._chart.timeScale();

    const x1 = timeScale.timeToCoordinate(this._source.point.time);
    this.point = { x: x1, y: y1 };
  }

  renderer() {
    return new ActionPointPaneRenderer(
      this.point,
      '' + this._source.point.price.toFixed(1),
      this._source._options
    );
  }
}

const defaultOptions: ActionPointOptions = {
  width: 20,
  showLabels: true,
  lineWidth: 2,
  position: "left",
  type: "buy"
}

export interface ActionPointOptions {
  width: number;
  showLabels: boolean;
  lineWidth: number;
  position: "left" | "right";
  type: "buy" | "sell"
}

export class ActionPoint implements ISeriesPrimitive<Time> {
  _chart: IChartApi;
  _series: ISeriesApi<keyof SeriesOptionsMap>;
  point: Point;
  _paneViews: ActionPointPaneView[];
  _options: ActionPointOptions;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<SeriesType>,
    point: Point,
    options?: Partial<ActionPointOptions>
  ) {
    this._chart = chart;
    this._series = series;
    this.point = point;
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
