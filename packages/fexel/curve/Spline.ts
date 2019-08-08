import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class SplineCurve2 extends Curve2 {
	constructor(public points: Vector2[] = []) {
		super();
	}

	clone() {
		return new SplineCurve2(this.points.map(p => p.clone()));
	}

	copy(curve: SplineCurve2) {
		this.points = curve.points.map(p => p.clone());
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		const p = (this.points.length - 1) * t;

		const intPoint = Math.floor(p);
		const weight = p - intPoint;

		const p0 = this.points[intPoint === 0 ? intPoint : intPoint - 1];
		const p1 = this.points[intPoint];
		const p2 = this.points[intPoint > this.points.length - 2 ? this.points.length - 1 : intPoint + 1];
		const p3 = this.points[intPoint > this.points.length - 3 ? this.points.length - 1 : intPoint + 2];

		return target.set(
			interpolateSpline(weight, p0.x, p1.x, p2.x, p3.x),
			interpolateSpline(weight, p0.y, p1.y, p2.y, p3.y)
		);
	}
}

export class SplineCurve3 extends Curve3 {
	constructor(public points: Vector3[] = []) {
		super();
	}

	clone() {
		return new SplineCurve3(this.points.map(p => p.clone()));
	}

	copy(curve: SplineCurve3) {
		this.points = curve.points.map(p => p.clone());
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		const p = (this.points.length - 1) * t;

		const intPoint = Math.floor(p);
		const weight = p - intPoint;

		const p0 = this.points[intPoint === 0 ? intPoint : intPoint - 1];
		const p1 = this.points[intPoint];
		const p2 = this.points[intPoint > this.points.length - 2 ? this.points.length - 1 : intPoint + 1];
		const p3 = this.points[intPoint > this.points.length - 3 ? this.points.length - 1 : intPoint + 2];

		return target.set(
			interpolateSpline(weight, p0.x, p1.x, p2.x, p3.x),
			interpolateSpline(weight, p0.y, p1.y, p2.y, p3.y),
			interpolateSpline(weight, p0.z, p1.z, p2.z, p3.z)
		);
	}
}

export function interpolateSpline(t: number, p0: number, p1: number, p2: number, p3: number) {
	const v0 = (p2 - p0) * 0.5;
	const v1 = (p3 - p1) * 0.5;
	const t2 = t * t;
	const t3 = t * t2;
	return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}
