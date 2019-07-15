import { Matrix4, ReadonlyMatrix4 } from './Matrix4';

export class Quaterion {
	constructor(public x = 0, public y = 0, public z = 0, public w = 1) {}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
	}

	equals(quaterion: Quaterion | ReadonlyQuaterion) {
		return this.x === quaterion.x && this.y === quaterion.y && this.z === quaterion.z && this.w === quaterion.w;
	}

	set(x = 0, y = 0, z = 0, w = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	}

	setFromEuler(euler: Euler | ReadonlyEuler) {
		const c1 = Math.cos(euler.x / 2);
		const c2 = Math.cos(euler.y / 2);
		const c3 = Math.cos(euler.z / 2);
		const s1 = Math.sin(euler.x / 2);
		const s2 = Math.sin(euler.y / 2);
		const s3 = Math.sin(euler.z / 2);

		if (euler.order === RotationOrder.XYZ) {
			this.x = s1 * c2 * c3 + c1 * s2 * s3;
			this.y = c1 * s2 * c3 - s1 * c2 * s3;
			this.z = c1 * c2 * s3 + s1 * s2 * c3;
			this.w = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.YXZ) {
			this.x = s1 * c2 * c3 + c1 * s2 * s3;
			this.y = c1 * s2 * c3 - s1 * c2 * s3;
			this.z = c1 * c2 * s3 - s1 * s2 * c3;
			this.w = c1 * c2 * c3 + s1 * s2 * s3;
		} else if (euler.order === RotationOrder.ZXY) {
			this.x = s1 * c2 * c3 - c1 * s2 * s3;
			this.y = c1 * s2 * c3 + s1 * c2 * s3;
			this.z = c1 * c2 * s3 + s1 * s2 * c3;
			this.w = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.ZYX) {
			this.x = s1 * c2 * c3 - c1 * s2 * s3;
			this.y = c1 * s2 * c3 + s1 * c2 * s3;
			this.z = c1 * c2 * s3 - s1 * s2 * c3;
			this.w = c1 * c2 * c3 + s1 * s2 * s3;
		} else if (euler.order === RotationOrder.YZX) {
			this.x = s1 * c2 * c3 + c1 * s2 * s3;
			this.y = c1 * s2 * c3 + s1 * c2 * s3;
			this.z = c1 * c2 * s3 - s1 * s2 * c3;
			this.w = c1 * c2 * c3 - s1 * s2 * s3;
		} else if (euler.order === RotationOrder.XZY) {
			this.x = s1 * c2 * c3 - c1 * s2 * s3;
			this.y = c1 * s2 * c3 - s1 * c2 * s3;
			this.z = c1 * c2 * s3 + s1 * s2 * c3;
			this.w = c1 * c2 * c3 + s1 * s2 * s3;
		}

		return this;
	}

	setFromRotationMatrix(matrix: Matrix4 | ReadonlyMatrix4) {
		const te = matrix.elements;

		const m11 = te[0];
		const m12 = te[4];
		const m13 = te[8];
		const m21 = te[1];
		const m22 = te[5];
		const m23 = te[9];
		const m31 = te[2];
		const m32 = te[6];
		const m33 = te[10];

		const trace = m11 + m22 + m33;
		let s = 0;

		if (trace > 0) {
			s = 0.5 / Math.sqrt(trace + 1.0);

			this.w = 0.25 / s;
			this.x = (m32 - m23) * s;
			this.y = (m13 - m31) * s;
			this.z = (m21 - m12) * s;
		} else if (m11 > m22 && m11 > m33) {
			s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

			this.w = (m32 - m23) / s;
			this.x = 0.25 * s;
			this.y = (m12 + m21) / s;
			this.z = (m13 + m31) / s;
		} else if (m22 > m33) {
			s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

			this.w = (m13 - m31) / s;
			this.x = (m12 + m21) / s;
			this.y = 0.25 * s;
			this.z = (m23 + m32) / s;
		} else {
			s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

			this.w = (m21 - m12) / s;
			this.x = (m13 + m31) / s;
			this.y = (m23 + m32) / s;
			this.z = 0.25 * s;
		}

		return this;
	}

	clone() {
		return new Quaterion(this.x, this.y, this.z, this.w);
	}

	copy(quaternion: Quaterion | ReadonlyQuaterion) {
		this.x = quaternion.x;
		this.y = quaternion.y;
		this.z = quaternion.z;
		this.w = quaternion.w;
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

	inverse() {
		return this.conjugate();
	}

	conjugate() {
		this.x = -this.x;
		this.y = -this.y;
		this.z = -this.z;
		return this;
	}

	dot(quaterion: Quaterion | ReadonlyQuaterion) {
		return this.x * quaterion.x + this.y * quaterion.y + this.z * quaterion.z + this.w * quaterion.w;
	}

	multiply(quaterion: Quaterion | ReadonlyQuaterion) {
		return this.multiplyQuaterions(this, quaterion);
	}

	premultiply(quaterion: Quaterion | ReadonlyQuaterion) {
		return this.multiplyQuaterions(quaterion, this);
	}

	multiplyQuaterions(a: Quaterion | ReadonlyQuaterion, b: Quaterion | ReadonlyQuaterion) {
		const qax = a.x;
		const qay = a.y;
		const qaz = a.z;
		const qaw = a.w;
		const qbx = b.x;
		const qby = b.y;
		const qbz = b.z;
		const qbw = b.w;
		this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
		return this;
	}

	static readonly Identity: ReadonlyQuaterion = new Quaterion();
}

export type ReadonlyQuaterion = Pick<Quaterion, 'length' | 'lengthSquared' | 'equals' | 'clone' | 'dot'> & {
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly w: number;
};

Object.freeze(Quaterion.Identity);

import { Euler, RotationOrder, ReadonlyEuler } from './Euler'; // hack circular dependency
