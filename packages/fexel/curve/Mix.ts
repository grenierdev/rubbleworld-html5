import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class MixCurve2 extends Curve2 {
	constructor(public a: Curve2, public b: Curve2, public factor = 0.5) {
		super();
	}

	clone() {
		return new MixCurve2(this.a.clone(), this.b.clone(), this.factor);
	}

	copy(curve: MixCurve2) {
		this.a = curve.a.clone();
		this.b = curve.b.clone();
		this.factor = curve.factor;
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		this.a.getPoint(t, target).multiplyScalar(this.factor);
		this.b.getPoint(t, v20).multiplyScalar(1 - this.factor);
		return target.add(v20);
	}
}

export class MixCurve3 extends Curve3 {
	constructor(public a: Curve3, public b: Curve3, public factor = 0.5) {
		super();
	}

	clone() {
		return new MixCurve3(this.a.clone(), this.b.clone(), this.factor);
	}

	copy(curve: MixCurve3) {
		this.a = curve.a.clone();
		this.b = curve.b.clone();
		this.factor = curve.factor;
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		this.a.getPoint(t, target).multiplyScalar(this.factor);
		this.b.getPoint(t, v30).multiplyScalar(1 - this.factor);
		return target.add(v30);
	}
}

const v20 = new Vector2();
const v30 = new Vector3();
