import { Vector3 } from './Vector3';
import { Sphere } from './Sphere';
import { Plane } from './Plane';
import { Triangle } from './Triangle';

export class Box3 {
	constructor(
		public min = new Vector3(-Infinity, -Infinity, -Infinity),
		public max = new Vector3(+Infinity, +Infinity, +Infinity)
	) {}

	get isEmpty() {
		return (
			this.max.x < this.min.x ||
			this.max.y < this.min.y ||
			this.max.z < this.min.z
		);
	}

	getCenter(target: Vector3) {
		return this.isEmpty
			? target.set(0, 0, 0)
			: target
					.copy(this.min)
					.add(this.max)
					.multiplyScalar(0.5);
	}

	getSize(target: Vector3) {
		return this.isEmpty
			? target.set(0, 0, 0)
			: target.copy(this.min).sub(this.max);
	}

	equals(box: Box3) {
		return box.min.equals(this.min) && box.max.equals(this.max);
	}

	set(min: Vector3, max: Vector3) {
		this.min.copy(min);
		this.max.copy(max);
		return this;
	}

	setFromPoints(points: Vector3[]) {
		this.makeEmpty();
		for (let i = 0, l = points.length; i < l; ++i) {
			this.expandByPoint(points[i]);
		}
		return this;
	}

	setFromCenterAndSize(center: Vector3, size: Vector3) {
		const halfSize = tv0.copy(size).multiplyScalar(0.5);
		this.min.copy(center).sub(halfSize);
		this.max.copy(center).add(halfSize);
		return this;
	}

	clone() {
		return new Box3(this.min.clone(), this.max.clone());
	}

	makeEmpty() {
		this.min.x = this.min.y = this.min.z = +Infinity;
		this.max.x = this.max.y = this.max.z = -Infinity;
		return this;
	}

	expandByPoint(point: Vector3) {
		this.min.min(point);
		this.max.max(point);
		return this;
	}

	expandByVector(vector: Vector3) {
		this.min.sub(vector);
		this.max.add(vector);
		return this;
	}

	expandByScalar(scalar: number) {
		this.min.addScalar(-scalar);
		this.max.addScalar(scalar);
		return this;
	}

	containsPoint(point: Vector3) {
		return point.x < this.min.x ||
			point.x > this.max.x ||
			point.y < this.min.y ||
			point.y > this.max.y ||
			point.z < this.min.z ||
			point.z > this.max.z
			? false
			: true;
	}

	containsBox(box: Box3) {
		return (
			this.min.x <= box.min.x &&
			box.max.x <= this.max.x &&
			this.min.y <= box.min.y &&
			box.max.y <= this.max.y &&
			this.min.z <= box.min.z &&
			box.max.z <= this.max.z
		);
	}

	intersectsBox(box: Box3) {
		return box.max.x < this.min.x ||
			box.min.x > this.max.x ||
			box.max.y < this.min.y ||
			box.min.y > this.max.y ||
			box.max.z < this.min.z ||
			box.min.z > this.max.z
			? false
			: true;
	}

	intersectsSphere(sphere: Sphere) {
		const c = sphere.center;
		const r = sphere.radius;
		this.clampPoint(c, tv0);
		return tv0.distanceToSquared(c) <= r * r;
	}

	intersectsPlane(plane: Plane) {
		let min: number = 0;
		let max: number = 0;

		const minx = this.min.x;
		const miny = this.min.y;
		const minz = this.min.z;
		const maxx = this.max.x;
		const maxy = this.max.y;
		const maxz = this.max.z;
		const nx = plane.normal.x;
		const ny = plane.normal.y;
		const nz = plane.normal.z;
		const c = plane.constant;

		if (nx > 0) {
			min = nx * minx;
			max = nx * maxx;
		} else {
			min = nx * maxx;
			max = nx * minx;
		}

		if (ny > 0) {
			min += ny * miny;
			max += ny * maxy;
		} else {
			min += ny * maxy;
			max += ny * miny;
		}

		if (nz > 0) {
			min += nz * minz;
			max += nz * maxz;
		} else {
			min += nz * maxz;
			max += nz * minz;
		}

		return min <= c && max >= c;
	}

	intersectsTriangle(triangle: Triangle) {
		if (this.isEmpty) {
			return false;
		}

		this.getCenter(c);
		e.subVectors(this.max, c);
		v0.subVectors(triangle.a, c);
		v1.subVectors(triangle.b, c);
		v2.subVectors(triangle.c, c);
		f0.subVectors(v1, v0);
		f1.subVectors(v2, v1);
		f2.subVectors(v0, v2);

		function satForAxes(axes: number[]): boolean {
			for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
				a.set(axes[i + 0], axes[i + 1], axes[i + 2]);
				const r =
					e.x * Math.abs(a.x) + e.y * Math.abs(a.y) + e.z * Math.abs(a.z);
				const p0 = v0.dot(a);
				const p1 = v1.dot(a);
				const p2 = v2.dot(a);
				if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
					return false;
				}
			}
			return true;
		}

		if (
			satForAxes([
				0,
				-f0.z,
				f0.y,
				0,
				-f1.z,
				f1.y,
				0,
				-f2.z,
				f2.y,
				f0.z,
				0,
				-f0.x,
				f1.z,
				0,
				-f1.x,
				f2.z,
				0,
				-f2.x,
				-f0.y,
				f0.x,
				0,
				-f1.y,
				f1.x,
				0,
				-f2.y,
				f2.x,
				0,
			]) === false
		) {
			return false;
		}

		if (satForAxes([1, 0, 0, 0, 1, 0, 0, 0, 1]) === false) {
			return false;
		}

		f0.cross(f1);
		return satForAxes([f0.x, f0.y, f0.z]);
	}

	getBoundingSphere(target: Sphere) {
		this.getCenter(target.center);
		this.getSize(v0);
		target.radius = v0.length * 0.5;
		return target;
	}

	clampPoint(point: Vector3, target: Vector3) {
		return target.copy(point).clamp(this.min, this.max);
	}

	distanceToPoint(point: Vector3) {
		const clampedPoint = tv0.copy(point).clamp(this.min, this.max);
		return clampedPoint.sub(point).length;
	}

	intersection(box: Box3) {
		this.min.max(box.min);
		this.max.min(box.max);
		return this;
	}

	union(box: Box3) {
		this.min.min(box.min);
		this.max.max(box.max);
		return this;
	}

	translate(offset: Vector3) {
		this.min.add(offset);
		this.max.add(offset);
		return this;
	}
}

const tv0 = new Vector3();
const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const f0 = new Vector3();
const f1 = new Vector3();
const f2 = new Vector3();
const a = new Vector3();
const c = new Vector3();
const e = new Vector3();
