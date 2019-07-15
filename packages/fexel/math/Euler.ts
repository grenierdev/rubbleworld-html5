import { Matrix4, ReadonlyMatrix4 } from './Matrix4';
import { clamp } from './util';
import { Vector3, ReadonlyVector3 } from './Vector3';

export enum RotationOrder {
	XYZ = 'XYZ',
	YZX = 'YZX',
	ZXY = 'ZXY',
	XZY = 'XZY',
	YXZ = 'YXZ',
	ZYX = 'ZYX',
}

export class Euler {
	constructor(public x = 0, public y = 0, public z = 0, public order = RotationOrder.XYZ) {}

	equals(euler: Euler | ReadonlyEuler) {
		return this.x === euler.x && this.y === euler.y && this.z === euler.z && this.order === euler.order;
	}

	set(x = 0, y = 0, z = 0, order = RotationOrder.XYZ) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.order = order;
		return this;
	}

	setX(x: number) {
		this.x = x;
		return this;
	}

	setY(y: number) {
		this.y = y;
		return this;
	}

	setZ(z: number) {
		this.z = z;
		return this;
	}

	setOrder(order: RotationOrder) {
		this.order = order;
		return this;
	}

	clone() {
		return new Euler(this.x, this.y, this.z, this.order);
	}

	copy(euler: Euler | ReadonlyEuler) {
		this.x = euler.x;
		this.y = euler.y;
		this.z = euler.z;
		this.order = euler.order;
		return this;
	}

	setFromRotationMatrix(matrix: Matrix4 | ReadonlyMatrix4, order = this.order) {
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

		if (order === RotationOrder.XYZ) {
			this.y = Math.asin(clamp(m13, -1, 1));
			if (Math.abs(m13) < 0.99999) {
				this.x = Math.atan2(-m23, m33);
				this.z = Math.atan2(-m12, m11);
			} else {
				this.x = Math.atan2(m32, m22);
				this.z = 0;
			}
		} else if (order === RotationOrder.YXZ) {
			this.x = Math.asin(-clamp(m23, -1, 1));

			if (Math.abs(m23) < 0.99999) {
				this.y = Math.atan2(m13, m33);
				this.z = Math.atan2(m21, m22);
			} else {
				this.y = Math.atan2(-m31, m11);
				this.z = 0;
			}
		} else if (order === RotationOrder.ZXY) {
			this.x = Math.asin(clamp(m32, -1, 1));

			if (Math.abs(m32) < 0.99999) {
				this.y = Math.atan2(-m31, m33);
				this.z = Math.atan2(-m12, m22);
			} else {
				this.y = 0;
				this.z = Math.atan2(m21, m11);
			}
		} else if (order === RotationOrder.ZYX) {
			this.y = Math.asin(-clamp(m31, -1, 1));

			if (Math.abs(m31) < 0.99999) {
				this.x = Math.atan2(m32, m33);
				this.z = Math.atan2(m21, m11);
			} else {
				this.x = 0;
				this.z = Math.atan2(-m12, m22);
			}
		} else if (order === RotationOrder.YZX) {
			this.z = Math.asin(clamp(m21, -1, 1));

			if (Math.abs(m21) < 0.99999) {
				this.x = Math.atan2(-m23, m22);
				this.y = Math.atan2(-m31, m11);
			} else {
				this.x = 0;
				this.y = Math.atan2(m13, m33);
			}
		} else if (order === RotationOrder.XZY) {
			this.z = Math.asin(-clamp(m12, -1, 1));

			if (Math.abs(m12) < 0.99999) {
				this.x = Math.atan2(m32, m22);
				this.y = Math.atan2(m13, m11);
			} else {
				this.x = Math.atan2(-m23, m33);
				this.y = 0;
			}
		}

		this.order = order;
		return this;
	}

	setFromQuaternion(quaterion: Quaterion | ReadonlyQuaterion, order = this.order) {
		m0.makeRotationFromQuaternion(quaterion);
		return this.setFromRotationMatrix(m0, order);
	}

	setFromVector3(vector: Vector3 | ReadonlyVector3, order = this.order) {
		return this.set(vector.x, vector.y, vector.z, order);
	}

	reorder(order = RotationOrder.XYZ) {
		q0.setFromEuler(this);
		return this.setFromQuaternion(q0, order);
	}

	static readonly Zero: ReadonlyEuler = new Euler(0, 0, 0);
}

export type ReadonlyEuler = Pick<Euler, 'equals' | 'clone'> & {
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly order: RotationOrder;
};

Object.freeze(Euler.Zero);

import { Quaterion, ReadonlyQuaterion } from './Quaterion'; // hack circular dependency

const m0 = new Matrix4();
const q0 = new Quaterion();
