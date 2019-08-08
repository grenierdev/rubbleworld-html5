import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class MinCurve2 extends Curve2 {
	constructor(public curves: Curve2[]) {
		super();
	}

	clone() {
		return new MinCurve2(this.curves.map(c => c.clone()));
	}

	copy(curve: MinCurve2) {
		this.curves = curve.curves.map(c => c.clone());
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		this.curves[0].getPoint(t, target);
		for (let i = 1, l = this.curves.length; i < l; ++i) {
			this.curves[i].getPoint(t, v20);
			target.min(v20);
		}
		return target;
	}
}

export class MinCurve3 extends Curve3 {
	constructor(public curves: Curve3[]) {
		super();
	}

	clone() {
		return new MinCurve3(this.curves.map(c => c.clone()));
	}

	copy(curve: MinCurve3) {
		this.curves = curve.curves.map(c => c.clone());
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		this.curves[0].getPoint(t, target);
		for (let i = 1, l = this.curves.length; i < l; ++i) {
			this.curves[i].getPoint(t, v30);
			target.min(v30);
		}
		return target;
	}
}

const v20 = new Vector2();
const v30 = new Vector3();
