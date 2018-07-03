import { clamp } from './util';
import { Matrix3 } from '.';
import { Matrix4 } from './Matrix4';
import { Quaterion } from './Quaterion';

export class Vector3 {
	constructor(
		public x = 0,
		public y = 0,
		public z = 0
	) {

	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z;
	}

	get lengthManhattan() {
		return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
	}

	equals(vector: Vector3) {
		return this.x === vector.x && this.y === vector.y && this.z === vector.z;
	}

	set(x = 0, y = 0, z = 0) {
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}

	setScalar(scalar: number) {
		this.x = scalar;
		this.y = scalar;
		this.z = scalar;
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

	setLength(length: number) {
		return this.normalize().multiplyScalar(length);
	}

	normalize() {
		return this.divideScalar(this.length || 1);
	}

	negate() {
		this.x = -this.x;
		this.y = -this.y;
		this.z = -this.z;
		return this;
	}

	clone() {
		return new Vector3(this.x, this.y, this.z);
	}

	copy(vector: Vector3) {
		this.x = vector.x;
		this.y = vector.y;
		this.z = vector.z;
		return this;
	}

	add(vector: Vector3) {
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		return this;
	}

	addVectors(a: Vector3, b: Vector3) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		return this;
	}

	addScalar(scalar: number) {
		this.x += scalar;
		this.y += scalar;
		this.z += scalar;
		return this;
	}

	sub(vector: Vector3) {
		this.x -= vector.x;
		this.y -= vector.y;
		this.z -= vector.z;
		return this;
	}

	subVectors(a: Vector3, b: Vector3) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		return this;
	}

	subScalar(scalar: number) {
		this.x -= scalar;
		this.y -= scalar;
		this.z -= scalar;
		return this;
	}

	multiply(vector: Vector3) {
		this.x *= vector.x;
		this.y *= vector.y;
		this.z *= vector.z;
		return this;
	}

	multiplyVectors(a: Vector3, b: Vector3) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;
		return this;
	}

	multiplyScalar(scalar: number) {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		return this;
	}

	divide(vector: Vector3) {
		this.x /= vector.x;
		this.y /= vector.y;
		this.z /= vector.z;
		return this;
	}

	divideVectors(a: Vector3, b: Vector3) {
		this.x = a.x / b.x;
		this.y = a.y / b.y;
		this.z = a.z / b.z;
		return this;
	}

	divideScalar(scalar: number) {
		this.x /= scalar;
		this.y /= scalar;
		this.z /= scalar;
		return this;
	}

	min(vector: Vector3) {
		this.x = Math.min(this.x, vector.x);
		this.y = Math.min(this.y, vector.y);
		this.z = Math.min(this.z, vector.z);
		return this;
	}

	max(vector: Vector3) {
		this.x = Math.max(this.x, vector.x);
		this.y = Math.max(this.y, vector.y);
		this.z = Math.max(this.z, vector.z);
		return this;
	}

	clamp(min: Vector3, max: Vector3) {
		this.x = Math.max(min.x, Math.min(max.x, this.x));
		this.y = Math.max(min.y, Math.min(max.y, this.y));
		this.z = Math.max(min.z, Math.min(max.z, this.z));
		return this;
	}

	clampLength(min: number, max: number) {
		const length = this.length;
		return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
	}

	project(normal: Vector3) {
		return this.multiplyScalar(normal.dot(this) / normal.lengthSquared);
	}

	reflect(normal: Vector3) {
		return this.sub(tmp.copy(normal).multiplyScalar(2 * this.dot(normal)));
	}

	dot(vector: Vector3) {
		return this.x * vector.x + this.y * vector.y + this.z * vector.z;
	}

	cross(vector: Vector3) {
		return this.crossVectors(this, vector);
	}

	crossVectors(a: Vector3, b: Vector3) {
		const ax = a.x;
		const bx = b.x;
		const ay = a.y;
		const by = b.y;
		const az = a.z;
		const bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;
		return this;
	}

	angleTo(vector: Vector3) {
		const theta = this.dot(vector) / (Math.sqrt(this.lengthSquared * vector.lengthSquared));
		return Math.acos(clamp(theta, - 1, 1));
	}

	distanceTo(vector: Vector3) {
		return Math.sqrt(this.distanceToSquared(vector));
	}

	distanceToSquared(vector: Vector3) {
		const dx = this.x - vector.x;
		const dy = this.y - vector.y;
		const dz = this.z - vector.z;
		return dx * dx + dy * dy + dz * dz;
	}

	manhattanDistanceTo(vector: Vector3) {
		return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y) + Math.abs(this.z - vector.z);
	}

	applyMatrix3(matrix: Matrix3) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const me = matrix.elements;

		this.x = me[0] * x + me[3] * y + me[6] * z;
		this.y = me[1] * x + me[4] * y + me[7] * z;
		this.z = me[2] * x + me[5] * y + me[8] * z;

		return this;

	}

	applyMatrix4(matrix: Matrix4) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const me = matrix.elements;

		const w = 1 / (me[3] * x + me[7] * y + me[11] * z + me[15]);

		this.x = (me[0] * x + me[4] * y + me[8] * z + me[12]) * w;
		this.y = (me[1] * x + me[5] * y + me[9] * z + me[13]) * w;
		this.z = (me[2] * x + me[6] * y + me[10] * z + me[14]) * w;

		return this;
	}

	applyQuaternion(quaterion: Quaterion) {
		const x = this.x;
		const y = this.y;
		const z = this.z;
		const qx = quaterion.x;
		const qy = quaterion.y;
		const qz = quaterion.z;
		const qw = quaterion.w;

		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = - qx * x - qy * y - qz * z;

		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;
	}

	static readonly One = new Vector3(1, 1, 1);
	static readonly Zero = new Vector3(0, 0, 0);
	static readonly Right = new Vector3(1, 0, 0);
	static readonly Up = new Vector3(0, 1, 0);
	static readonly Forward = new Vector3(0, 0, 1);
}

Object.freeze(Vector3.One);
Object.freeze(Vector3.Zero);
Object.freeze(Vector3.Right);
Object.freeze(Vector3.Up);
Object.freeze(Vector3.Forward);

const tmp = new Vector3();