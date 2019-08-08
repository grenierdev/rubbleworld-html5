import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export class LineCurve2 extends Curve2 {
	constructor(public v0 = new Vector2(), public v1 = new Vector2()) {
		super();
	}

	clone() {
		return new LineCurve2(this.v0.clone(), this.v1.clone());
	}

	copy(curve: LineCurve2) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		if (t === 1) {
			return target.copy(this.v1);
		}
		return target
			.copy(this.v1)
			.sub(this.v0)
			.multiplyScalar(t)
			.add(this.v0);
	}
}

export class LineCurve3 extends Curve3 {
	constructor(public v0 = new Vector3(), public v1 = new Vector3()) {
		super();
	}

	clone() {
		return new LineCurve3(this.v0.clone(), this.v1.clone());
	}

	copy(curve: LineCurve3) {
		this.v0.copy(curve.v0);
		this.v1.copy(curve.v1);
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		if (t === 1) {
			return target.copy(this.v1);
		}
		return target
			.copy(this.v1)
			.sub(this.v0)
			.multiplyScalar(t)
			.add(this.v0);
	}
}
