import { Vector2, ReadonlyVector2 } from './Vector2';
import { Box2, ReadonlyBox2 } from './Box2';

export class Circle {
	constructor(public center = new Vector2(), public radius = 0) {}

	get isEmpty() {
		return this.radius < 0;
	}

	equals(sphere: Circle | ReadonlyCircle) {
		return this.center.equals(sphere.center) && this.radius === sphere.radius;
	}

	set(center: Vector2 | ReadonlyVector2, radius: number) {
		this.center.copy(center);
		this.radius = radius;
		return this;
	}

	setFromPoints(points: (Vector2 | ReadonlyVector2)[]) {
		const center = tb0.setFromPoints(points).getCenter(this.center);

		let maxRadius = 0;
		for (let i = 0, l = points.length; i < l; ++i) {
			maxRadius = Math.max(maxRadius, center.distanceToSquared(points[i]));
		}
		this.radius = Math.sqrt(maxRadius);

		return this;
	}

	clone() {
		return new Circle(this.center.clone(), this.radius);
	}

	copy(sphere: Circle | ReadonlyCircle) {
		this.center.copy(sphere.center);
		this.radius = sphere.radius;
		return this;
	}

	containsPoint(point: Vector2 | ReadonlyVector2) {
		const r = this.radius;
		return point.distanceToSquared(this.center) <= r * r;
	}

	distanceToPoint(point: Vector2 | ReadonlyVector2) {
		return point.distanceTo(this.center) - this.radius;
	}

	intersectsCircle(sphere: Circle | ReadonlyCircle) {
		const s = this.radius + sphere.radius;
		return sphere.center.distanceToSquared(this.center) <= s * s;
	}

	// intersectsBox(box: Box2 | ReadonlyBox2) {
	// 	return box.intersectsCircle(this);
	// }

	// intersectsPlane(plane: Plane | ReadonlyPlane) {
	// 	return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
	// }

	clampPoint(point: Vector2 | ReadonlyVector2, target: Vector2) {
		const r = this.radius;
		const c = this.center;
		const deltaLengthSq = c.distanceToSquared(point);
		target.copy(point);
		if (deltaLengthSq > r * r) {
			target
				.sub(c)
				.normalize()
				.multiplyScalar(r)
				.add(c);
		}
		return target;
	}

	getBoundingBox(target: Box2) {
		target.set(this.center, this.center);
		target.expandByScalar(this.radius);
		return target;
	}

	translate(offset: Vector2 | ReadonlyVector2) {
		this.center.add(offset);
		return this;
	}

	makeEmpty() {
		this.radius = 0;
		return this;
	}
}

export type ReadonlyCircle = Pick<
	Circle,
	| 'isEmpty'
	| 'equals'
	| 'clone'
	| 'containsPoint'
	| 'distanceToPoint'
	| 'intersectsCircle'
	// | 'intersectsBox'
	// | 'intersectsPlane'
	| 'getBoundingBox'
> & { readonly center: ReadonlyVector2; readonly radius: number };

const tb0 = new Box2();
