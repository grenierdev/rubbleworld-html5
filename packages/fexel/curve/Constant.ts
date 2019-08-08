import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class ConstantCurve2 extends Curve2 {
	constructor(public constant: Vector2) {
		super();
	}

	clone() {
		return new ConstantCurve2(this.constant.clone());
	}

	copy(curve: ConstantCurve2) {
		this.constant.copy(curve.constant);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		return target.copy(this.constant);
	}
}

export class ConstantCurve3 extends Curve3 {
	constructor(public constant: Vector3) {
		super();
	}

	clone() {
		return new ConstantCurve3(this.constant.clone());
	}

	copy(curve: ConstantCurve3) {
		this.constant.copy(curve.constant);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		return target.copy(this.constant);
	}
}
