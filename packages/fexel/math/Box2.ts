import { Vector2, ReadonlyVector2 } from './Vector2';

export class Box2 {
	constructor(public min = new Vector2(-Infinity, -Infinity), public max = new Vector2(+Infinity, +Infinity)) {}

	get isEmpty() {
		return this.max.x < this.min.x || this.max.y < this.min.y;
	}

	getCenter(target: Vector2) {
		return this.isEmpty
			? target.set(0, 0)
			: target
					.copy(this.min)
					.add(this.max)
					.multiplyScalar(0.5);
	}

	getSize(target: Vector2) {
		return this.isEmpty ? target.set(0, 0) : target.subVectors(this.max, this.min);
	}

	equals(box: Box2 | ReadonlyBox2) {
		return box.min.equals(this.min) && box.max.equals(this.max);
	}

	set(min: Vector2 | ReadonlyVector2, max: Vector2 | ReadonlyVector2) {
		this.min.copy(min);
		this.max.copy(max);
		return this;
	}

	setFromPoints(points: (Vector2 | ReadonlyVector2)[]) {
		this.makeEmpty();
		for (let i = 0, l = points.length; i < l; ++i) {
			this.expandByPoint(points[i]);
		}
		return this;
	}

	setFromCenterAndSize(center: Vector2 | ReadonlyVector2, size: Vector2 | ReadonlyVector2) {
		const halfSize = tv0.copy(size).multiplyScalar(0.5);
		this.min.copy(center).sub(halfSize);
		this.max.copy(center).add(halfSize);
		return this;
	}

	clone() {
		return new Box2(this.min.clone(), this.max.clone());
	}

	makeEmpty() {
		this.min.x = this.min.y = +Infinity;
		this.max.x = this.max.y = -Infinity;
		return this;
	}

	expandByPoint(point: Vector2 | ReadonlyVector2) {
		this.min.min(point);
		this.max.max(point);
		return this;
	}

	expandByVector(vector: Vector2 | ReadonlyVector2) {
		this.min.sub(vector);
		this.max.add(vector);
		return this;
	}

	expandByScalar(scalar: number) {
		this.min.addScalar(-scalar);
		this.max.addScalar(scalar);
		return this;
	}

	containsPoint(point: Vector2 | ReadonlyVector2) {
		return point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y ? false : true;
	}

	containsBox(box: Box2 | ReadonlyBox2) {
		return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y;
	}

	intersectsBox(box: Box2 | ReadonlyBox2) {
		return box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y
			? false
			: true;
	}

	clampPoint(point: Vector2 | ReadonlyVector2, target: Vector2) {
		return target.copy(point).clamp(this.min, this.max);
	}

	distanceToPoint(point: Vector2 | ReadonlyVector2) {
		const clampedPoint = tv0.copy(point).clamp(this.min, this.max);
		return clampedPoint.sub(point).length;
	}

	intersection(box: Box2 | ReadonlyBox2) {
		this.min.max(box.min);
		this.max.min(box.max);
		return this;
	}

	union(box: Box2 | ReadonlyBox2) {
		this.min.min(box.min);
		this.max.max(box.max);
		return this;
	}

	translate(offset: Vector2 | ReadonlyVector2) {
		this.min.add(offset);
		this.max.add(offset);
		return this;
	}
}

export type ReadonlyBox2 = Pick<
	Box2,
	'isEmpty' | 'getCenter' | 'getSize' | 'equals' | 'clone' | 'containsPoint' | 'containsBox' | 'intersectsBox'
> & { readonly min: ReadonlyVector2; readonly max: ReadonlyVector2 };

const tv0 = new Vector2();
