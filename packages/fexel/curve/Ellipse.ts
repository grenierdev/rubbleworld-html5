import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';

export class EllipseCurve2 extends Curve2 {
	constructor(
		public x = 0,
		public y = 0,
		public radiusX = 1,
		public radiusY = 1,
		public angleStart = 0,
		public angleEnd = 2 * Math.PI,
		public clockwise = false,
		public rotation = 0
	) {
		super();
	}

	clone() {
		return new EllipseCurve2(
			this.x,
			this.y,
			this.radiusX,
			this.radiusY,
			this.angleStart,
			this.angleEnd,
			this.clockwise,
			this.rotation
		);
	}

	copy(curve: EllipseCurve2) {
		this.x = curve.x;
		this.y = curve.y;
		this.radiusX = curve.radiusX;
		this.radiusY = curve.radiusY;
		this.angleStart = curve.angleStart;
		this.angleEnd = curve.angleEnd;
		this.clockwise = curve.clockwise;
		this.rotation = curve.rotation;
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector2) {
		const twoPi = Math.PI * 2;
		let deltaAngle = this.angleEnd - this.angleStart;
		const samePoints = Math.abs(deltaAngle) < Number.EPSILON;

		while (deltaAngle < 0) deltaAngle += twoPi;
		while (deltaAngle > twoPi) deltaAngle -= twoPi;

		if (deltaAngle < Number.EPSILON) {
			if (samePoints) {
				deltaAngle = 0;
			} else {
				deltaAngle = twoPi;
			}
		}

		if (this.clockwise === true && !samePoints) {
			if (deltaAngle === twoPi) {
				deltaAngle = -twoPi;
			} else {
				deltaAngle = deltaAngle - twoPi;
			}
		}

		const angle = this.angleStart + t * deltaAngle;
		let x = this.x + this.radiusX * Math.cos(angle);
		let y = this.y + this.radiusY * Math.sin(angle);

		if (this.rotation !== 0) {
			const cos = Math.cos(this.rotation);
			const sin = Math.sin(this.rotation);

			const tx = x - this.x;
			const ty = y - this.y;

			x = tx * cos - ty * sin + this.x;
			y = tx * sin + ty * cos + this.y;
		}

		return target.set(x, y);
	}
}

export class EllipseCurve3 extends Curve3 {
	constructor(
		public aX = 0,
		public aY = 0,
		public radiusX = 1,
		public radiusY = 1,
		public angleStart = 0,
		public angleEnd = 2 * Math.PI,
		public clockwise = false,
		public rotation = 0,
		public transform = Matrix4.Identity
	) {
		super();
	}

	clone() {
		return new EllipseCurve3(
			this.aX,
			this.aY,
			this.radiusX,
			this.radiusY,
			this.angleStart,
			this.angleEnd,
			this.clockwise,
			this.rotation,
			this.transform.clone()
		);
	}

	copy(curve: EllipseCurve3) {
		this.aX = curve.aX;
		this.aY = curve.aY;
		this.radiusX = curve.radiusX;
		this.radiusY = curve.radiusY;
		this.angleStart = curve.angleStart;
		this.angleEnd = curve.angleEnd;
		this.clockwise = curve.clockwise;
		this.rotation = curve.rotation;
		this.transform = curve.transform.clone();
		this.cacheArcLengths = [];
		return this;
	}

	getPoint(t: number, target: Vector3) {
		const twoPi = Math.PI * 2;
		let deltaAngle = this.angleEnd - this.angleStart;
		const samePoints = Math.abs(deltaAngle) < Number.EPSILON;

		while (deltaAngle < 0) deltaAngle += twoPi;
		while (deltaAngle > twoPi) deltaAngle -= twoPi;

		if (deltaAngle < Number.EPSILON) {
			if (samePoints) {
				deltaAngle = 0;
			} else {
				deltaAngle = twoPi;
			}
		}

		if (this.clockwise === true && !samePoints) {
			if (deltaAngle === twoPi) {
				deltaAngle = -twoPi;
			} else {
				deltaAngle = deltaAngle - twoPi;
			}
		}

		const angle = this.angleStart + t * deltaAngle;
		let x = this.aX + this.radiusX * Math.cos(angle);
		let y = this.aY + this.radiusY * Math.sin(angle);

		if (this.rotation !== 0) {
			const cos = Math.cos(this.rotation);
			const sin = Math.sin(this.rotation);

			const tx = x - this.aX;
			const ty = y - this.aY;

			x = tx * cos - ty * sin + this.aX;
			y = tx * sin + ty * cos + this.aY;
		}

		return target.set(x, y, 0).applyMatrix4(this.transform);
	}
}
