import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class CubicBezierCurve2 extends Curve2 {
	constructor(
		public v0 = new Vector2(),
		public v1 = new Vector2(),
		public v2 = new Vector2(),
		public v3 = new Vector2()
	) {
		super();
	}

	clone() {
		return new CubicBezierCurve2(this.v0.clone(), this.v1.clone(), this.v2.clone(), this.v3.clone());
	}

	copy(curve: CubicBezierCurve2) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.v2.copy(curve.v2);
		this.v3.copy(curve.v3);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		return target.set(
			interpolateCubicBezier(t, this.v0.x, this.v1.x, this.v2.x, this.v3.x),
			interpolateCubicBezier(t, this.v0.y, this.v1.y, this.v2.y, this.v3.y)
		);
	}
}

export class CubicBezierCurve3 extends Curve3 {
	constructor(
		public v0 = new Vector3(),
		public v1 = new Vector3(),
		public v2 = new Vector3(),
		public v3 = new Vector3()
	) {
		super();
	}

	clone() {
		return new CubicBezierCurve3(this.v0.clone(), this.v1.clone(), this.v2.clone(), this.v3.clone());
	}

	copy(curve: CubicBezierCurve3) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.v2.copy(curve.v2);
		this.v3.copy(curve.v3);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		return target.set(
			interpolateCubicBezier(t, this.v0.x, this.v1.x, this.v2.x, this.v3.x),
			interpolateCubicBezier(t, this.v0.y, this.v1.y, this.v2.y, this.v3.y),
			interpolateCubicBezier(t, this.v0.z, this.v1.z, this.v2.z, this.v3.z)
		);
	}
}

export function interpolateCubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
	const k = 1 - t;
	return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
}
