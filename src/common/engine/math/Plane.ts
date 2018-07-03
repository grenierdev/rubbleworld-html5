import { Vector3, Sphere, Box, Line } from ".";

export class Plane {
	constructor(
		public normal = new Vector3(1, 0, 0),
		public constant = 0
	) {

	}

	equals(plane: Plane) {
		return this.normal.equals(plane.normal) && this.constant === plane.constant;
	}

	set(normal: Vector3, constant: number) {
		this.normal.copy(normal);
		this.constant = constant;
		return this;
	}

	setFromComponents(x: number, y: number, z: number, w: number) {
		this.normal.set(x, y, z);
		this.constant = w;
		return this;
	}

	setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3) {
		this.normal.copy(normal);
		this.constant = -point.dot(this.normal);
		return this;
	}

	setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3) {
		const normal = v0.subVectors(c, b).cross(v1.subVectors(a, b)).normalize();
		this.setFromNormalAndCoplanarPoint(normal, a);
		return this;
	}

	clone() {
		return new Plane(this.normal.clone(), this.constant);
	}

	copy(plane: Plane) {
		this.normal.copy(plane.normal);
		this.constant = plane.constant;
		return this;
	}

	normalize() {
		const invNormalLength = 1.0 / this.normal.length;
		this.normal.multiplyScalar(invNormalLength);
		this.constant *= invNormalLength;
		return this;
	}

	negate() {
		this.normal.negate();
		this.constant *= -1;
		return this;
	}

	distanceToPoint(point: Vector3) {
		return this.normal.dot(point) + this.constant;
	}

	distanceToSphere(sphere: Sphere) {
		return this.distanceToPoint(sphere.center) - sphere.radius;
	}

	projectPoint(point: Vector3, target: Vector3) {
		return target.copy(this.normal).multiplyScalar(-this.distanceToPoint(point)).add(point);
	}

	lineIntersection(line: Line, target: Vector3) {
		const direction = line.delta(v0);
		const denominator = this.normal.dot(direction);
		if (denominator === 0) {
			if (this.distanceToPoint(line.start) === 0) {
				return target.copy(line.start);
			}
			throw new RangeError(`Line does not intersect this plane. Check Plane.intersectsLine first.`);
		}

		const t = -(line.start.dot(this.normal) + this.constant) / denominator;
		if (t < 0 || t > 1) {
			throw new RangeError(`Line does not intersect this plane. Check Plane.intersectsLine first.`);
		}
		return target.copy(direction).multiplyScalar(t).add(line.start);
	}

	intersectsLine(line: Line) {
		const startSign = this.distanceToPoint(line.start);
		const endSign = this.distanceToPoint(line.end);
		return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
	}

	intersectsBox(box: Box) {
		return box.intersectsPlane(this);
	}

	intersectsSphere(sphere: Sphere) {
		return sphere.intersectsPlane(this);
	}

	coplanarPoint(target: Vector3) {
		return target.copy(this.normal).multiplyScalar(-this.constant);
	}

	translate(offset: Vector3) {
		this.constant -= offset.dot(this.normal);
		return this;
	}
}

const v0 = new Vector3();
const v1 = new Vector3();