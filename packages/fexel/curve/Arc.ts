import { EllipseCurve2, EllipseCurve3 } from './Ellipse';
import { Matrix4 } from '../math/Matrix4';

export class ArcCurve2 extends EllipseCurve2 {
	constructor(x = 0, y = 0, radiusX = 1, radiusY = 1, angleStart = 0, angleEnd = 2 * Math.PI, clockwise = false) {
		super(x, y, radiusX, radiusY, angleStart, angleEnd, clockwise, 0);
	}

	clone() {
		return new ArcCurve2(this.x, this.y, this.radiusX, this.radiusY, this.angleStart, this.angleEnd, this.clockwise);
	}

	copy(curve: ArcCurve2) {
		this.x = curve.x;
		this.y = curve.y;
		this.radiusX = curve.radiusX;
		this.radiusY = curve.radiusY;
		this.angleStart = curve.angleStart;
		this.angleEnd = curve.angleEnd;
		this.clockwise = curve.clockwise;
		this.cacheArcLengths = [];
		return this;
	}
}

export class ArcCurve3 extends EllipseCurve3 {
	constructor(
		x = 0,
		y = 0,
		radiusX = 1,
		radiusY = 1,
		angleStart = 0,
		angleEnd = 2 * Math.PI,
		clockwise = false,
		transform = Matrix4.Identity
	) {
		super(x, y, radiusX, radiusY, angleStart, angleEnd, clockwise, 0, transform);
	}

	clone() {
		return new ArcCurve3(
			this.aX,
			this.aY,
			this.radiusX,
			this.radiusY,
			this.angleStart,
			this.angleEnd,
			this.clockwise,
			this.transform.clone()
		);
	}

	copy(curve: ArcCurve3) {
		this.aX = curve.aX;
		this.aY = curve.aY;
		this.radiusX = curve.radiusX;
		this.radiusY = curve.radiusY;
		this.angleStart = curve.angleStart;
		this.angleEnd = curve.angleEnd;
		this.clockwise = curve.clockwise;
		this.transform = curve.transform.clone();
		this.cacheArcLengths = [];
		return this;
	}
}
