import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class QuadraticBezier2 extends Curve2 {
	constructor(public v0 = new Vector2(), public v1 = new Vector2(), public v2 = new Vector2()) {
		super();
	}

	clone() {
		return new QuadraticBezier2(this.v0.clone(), this.v1.clone(), this.v2.clone());
	}

	copy(curve: QuadraticBezier2) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.v2.copy(curve.v2);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		return target.set(
			interpolateQuadraticBezier(t, this.v0.x, this.v1.x, this.v2.x),
			interpolateQuadraticBezier(t, this.v0.y, this.v1.y, this.v2.y)
		);
	}
}

export class QuadraticBezier3 extends Curve3 {
	constructor(public v0 = new Vector3(), public v1 = new Vector3(), public v2 = new Vector3()) {
		super();
	}

	clone() {
		return new QuadraticBezier3(this.v0.clone(), this.v1.clone(), this.v2.clone());
	}

	copy(curve: QuadraticBezier3) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.v2.copy(curve.v2);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		return target.set(
			interpolateQuadraticBezier(t, this.v0.x, this.v1.x, this.v2.x),
			interpolateQuadraticBezier(t, this.v0.y, this.v1.y, this.v2.y),
			interpolateQuadraticBezier(t, this.v0.z, this.v1.z, this.v2.z)
		);
	}
}

export function interpolateQuadraticBezier(t: number, p0: number, p1: number, p2: number) {
	const k = 1 - t;
	return k * k * p0 + 2 * k * t * p1 + t * t * p2;
}
