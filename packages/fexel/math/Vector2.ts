import { clamp, NumberArray } from './util';
import { Matrix3, ReadonlyMatrix3 } from './Matrix3';

export class Vector2 {
	constructor(public x = 0, public y = 0) {}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y;
	}

	get lengthManhattan() {
		return Math.abs(this.x) + Math.abs(this.y);
	}

	get angle() {
		const angle = Math.atan2(this.y, this.x);
		return angle < 0 ? angle + 2 * Math.PI : angle;
	}

	equals(vector: Vector2 | ReadonlyVector2) {
		return this.x === vector.x && this.y === vector.y;
	}

	set(x = 0, y = 0) {
		this.x = x;
		this.y = y;
		return this;
	}

	setScalar(scalar: number) {
		this.x = scalar;
		this.y = scalar;
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

	setLength(length: number) {
		return this.normalize().multiplyScalar(length);
	}

	normalize() {
		return this.divideScalar(this.length || 1);
	}

	negate() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}

	clone() {
		return new Vector2(this.x, this.y);
	}

	copy(vector: Vector2 | ReadonlyVector2) {
		this.x = vector.x;
		this.y = vector.y;
		return this;
	}

	add(vector: Vector2 | ReadonlyVector2) {
		this.x += vector.x;
		this.y += vector.y;
		return this;
	}

	addVectors(a: Vector2 | ReadonlyVector2, b: Vector2 | ReadonlyVector2) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		return this;
	}

	addScalar(x: number, y = x) {
		this.x += x;
		this.y += y;
		return this;
	}

	sub(vector: Vector2 | ReadonlyVector2) {
		this.x -= vector.x;
		this.y -= vector.y;
		return this;
	}

	subVectors(a: Vector2 | ReadonlyVector2, b: Vector2 | ReadonlyVector2) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this;
	}

	subScalar(x: number, y = x) {
		this.x -= x;
		this.y -= y;
		return this;
	}

	multiply(vector: Vector2 | ReadonlyVector2) {
		this.x *= vector.x;
		this.y *= vector.y;
		return this;
	}

	multiplyVectors(a: Vector2 | ReadonlyVector2, b: Vector2 | ReadonlyVector2) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		return this;
	}

	multiplyScalar(x: number, y = x) {
		this.x *= x;
		this.y *= y;
		return this;
	}

	divide(vector: Vector2 | ReadonlyVector2) {
		this.x /= vector.x;
		this.y /= vector.y;
		return this;
	}

	divideVectors(a: Vector2 | ReadonlyVector2, b: Vector2 | ReadonlyVector2) {
		this.x = a.x / b.x;
		this.y = a.y / b.y;
		return this;
	}

	divideScalar(x: number, y = x) {
		this.x /= x;
		this.y /= y;
		return this;
	}

	min(vector: Vector2 | ReadonlyVector2) {
		this.x = Math.min(this.x, vector.x);
		this.y = Math.min(this.y, vector.y);
		return this;
	}

	max(vector: Vector2 | ReadonlyVector2) {
		this.x = Math.max(this.x, vector.x);
		this.y = Math.max(this.y, vector.y);
		return this;
	}

	clamp(min: Vector2 | ReadonlyVector2, max: Vector2 | ReadonlyVector2) {
		this.x = Math.max(min.x, Math.min(max.x, this.x));
		this.y = Math.max(min.y, Math.min(max.y, this.y));
		return this;
	}

	clampLength(min: number, max: number) {
		const length = this.length;
		return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
	}

	project(normal: Vector2 | ReadonlyVector2) {
		return this.multiplyScalar(normal.dot(this) / normal.lengthSquared);
	}

	reflect(normal: Vector2 | ReadonlyVector2) {
		return this.sub(tmp.copy(normal).multiplyScalar(2 * this.dot(normal)));
	}

	dot(vector: Vector2 | ReadonlyVector2) {
		return this.x * vector.x + this.y * vector.y;
	}

	cross(vector: Vector2 | ReadonlyVector2) {
		return this.x * vector.y - this.y * vector.x;
	}

	angleTo(vector: Vector2 | ReadonlyVector2) {
		const theta = this.dot(vector) / Math.sqrt(this.lengthSquared * vector.lengthSquared);
		return Math.acos(clamp(theta, -1, 1));
	}

	distanceTo(vector: Vector2 | ReadonlyVector2) {
		return Math.sqrt(this.distanceToSquared(vector));
	}

	distanceToSquared(vector: Vector2 | ReadonlyVector2) {
		const dx = this.x - vector.x;
		const dy = this.y - vector.y;
		return dx * dx + dy * dy;
	}

	manhattanDistanceTo(vector: Vector2 | ReadonlyVector2) {
		return Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
	}

	applyMatrix3(matrix: Matrix3 | ReadonlyMatrix3) {
		const x = this.x;
		const y = this.y;
		const me = matrix.elements;

		this.x = me[0] * x + me[3] * y + me[6];
		this.y = me[1] * x + me[4] * y + me[7];

		return this;
	}

	static mutateArray(data: NumberArray, mutator: (vertor: Vector2) => void, offset = 0, length?: number) {
		length = length || data.length;
		if (length % 2 !== 0) {
			throw RangeError(`Vector2.mutateArray expected data of multiple of 2, got ${length}.`);
		}

		for (let i = offset, l = offset + length; i < l; i += 2) {
			mutable.set(data[i + 0], data[i + 1]);
			mutator(mutable);
			data[i + 0] = mutable.x;
			data[i + 1] = mutable.y;
		}
	}

	static readonly One: ReadonlyVector2 = new Vector2(1, 1);
	static readonly Zero: ReadonlyVector2 = new Vector2(0, 0);
	static readonly Right: ReadonlyVector2 = new Vector2(1, 0);
	static readonly Up: ReadonlyVector2 = new Vector2(0, 1);
}

export type ReadonlyVector2 = Pick<
	Vector2,
	| 'angle'
	| 'length'
	| 'lengthSquared'
	| 'lengthManhattan'
	| 'equals'
	| 'clone'
	| 'dot'
	| 'cross'
	| 'angleTo'
	| 'distanceTo'
	| 'distanceToSquared'
	| 'manhattanDistanceTo'
> & { readonly x: number; readonly y: number };

Object.freeze(Vector2.One);
Object.freeze(Vector2.Zero);
Object.freeze(Vector2.Right);
Object.freeze(Vector2.Up);

const tmp = new Vector2();
const mutable = new Vector2();
