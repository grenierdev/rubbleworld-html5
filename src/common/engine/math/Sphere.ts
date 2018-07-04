import { Vector3 } from "./Vector3";
import { Box } from "./Box";
import { Plane } from "./Plane";

export class Sphere {
	constructor(
		public center = new Vector3(),
		public radius = 0
	) {
		
	}

	get isEmpty() {
		return this.radius < 0;
	}

	equals(sphere: Sphere) {
		return this.center.equals(sphere.center) && this.radius === sphere.radius;
	}

	set(center: Vector3, radius: number) {
		this.center.copy(center);
		this.radius = radius;
		return this;
	}

	setFromPoints(points: Vector3[]) {
		const center = tb0.setFromPoints(points).getCenter(this.center);

		let maxRadius = 0;
		for (let i = 0, l = points.length; i < l; ++i) {
			maxRadius = Math.max(maxRadius, center.distanceToSquared(points[i]));
		}
		this.radius = Math.sqrt(maxRadius);

		return this;
	}

	clone() {
		return new Sphere(this.center.clone(), this.radius);
	}

	copy(sphere: Sphere) {
		this.center.copy(sphere.center);
		this.radius = sphere.radius;
		return this;
	}

	containsPoint(point: Vector3) {
		const r = this.radius;
		return point.distanceToSquared(this.center) <= r * r;
	}

	distanceToPoint(point: Vector3) {
		return point.distanceTo(this.center) - this.radius;
	}

	intersectsSphere(sphere: Sphere) {
		const s = this.radius + sphere.radius;
		return sphere.center.distanceToSquared(this.center) <= s * s;
	}

	intersectsBox(box: Box) {
		return box.intersectsSphere(this);
	}

	intersectsPlane(plane: Plane) {
		return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
	}

	clampPoint(point: Vector3, target: Vector3) {
		const r = this.radius;
		const c = this.center;
		const deltaLengthSq = c.distanceToSquared(point);
		target.copy(point);
		if (deltaLengthSq > r * r) {
			target.sub(c).normalize().multiplyScalar(r).add(c);
		}
		return target;
	}

	getBoundingBox(target: Box) {
		target.set(this.center, this.center);
		target.expandByScalar(this.radius);
		return target;
	}

	translate(offset: Vector3) {
		this.center.add(offset);
		return this;
	}

	makeEmpty() {
		this.radius = 0;
		return this;
	}
}

const tb0 = new Box();