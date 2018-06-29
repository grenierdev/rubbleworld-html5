import { clamp } from './util';

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
		const ax = this.x;
		const bx = vector.x;
		const ay = this.y;
		const by = vector.y;
		const az = this.z;
		const bz = vector.z;

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
}

const tmp = new Vector3();