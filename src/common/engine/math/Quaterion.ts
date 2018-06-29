import { clamp } from './util';

export class Quaterion {
	constructor(
		public x = 0,
		public y = 0,
		public z = 0,
		public w = 1
	) {

	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
	}

	set(x = 0, y = 0, z = 0, w = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	}

	normalize() {
		let length = this.length;
		if (length === 0) {
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 1;
		} else {
			length = 1 / length;
			this.x *= length;
			this.y *= length;
			this.z *= length;
			this.w *= length;

		}
		return this;
	}

	clone() {
		return new Quaterion(this.x, this.y, this.z, this.w);
	}

	// TODO: https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js
}