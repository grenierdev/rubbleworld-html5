import { Vector3 } from ".";

export class Box {
	constructor(
		public min = new Vector3(-Infinity, -Infinity, -Infinity),
		public max = new Vector3(+Infinity, +Infinity, +Infinity)
	) {
	}

	get isEmpty() {
		return (this.max.x < this.min.x) || (this.max.y < this.min.y) || (this.max.z < this.min.z);
	}

	getCenter(target: Vector3) {
		if (this.isEmpty) {
			target.set(0, 0, 0);
		} else {
			target.copy(tmpV3.copy(this.min).add(this.max)).multiplyScalar(0.5);
		}
		return target;
	}

	getSize(target: Vector3) {
		if (this.isEmpty) {
			target.set(0, 0, 0);
		} else {
			target.copy(tmpV3.copy(this.min).sub(this.max));
		}
		return target;
	}

	equals(box: Box) {
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
		const halfSize = tmpV3.copy(size).multiplyScalar(0.5);
		this.min.copy(center).sub(halfSize);
		this.max.copy(center).add(halfSize);
		return this;
	}

	clone() {
		return new Box(this.min.clone(), this.max.clone());
	}

	makeEmpty() {
		this.min.x = this.min.y = this.min.z = -Infinity;
		this.max.x = this.max.y = this.max.z = +Infinity;
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
		return point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y || point.z < this.min.z || point.z > this.max.z ? false : true;
	}

	containsBox(box: Box) {
		return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y && this.min.z <= box.min.z && box.max.z <= this.max.z;
	}

	intersectsBox(box: Box) {
		return box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y || box.max.z < this.min.z || box.min.z > this.max.z ? false : true;
	}

	// TODO: intersectsSphere https://github.com/mrdoob/three.js/blob/dev/src/math/Box3.js#L328
	// TODO: intersectsPlane https://github.com/mrdoob/three.js/blob/dev/src/math/Box3.js#L344
	// TODO: intersectsTriangle https://github.com/mrdoob/three.js/blob/dev/src/math/Box3.js#L391
	// TODO: getBoundingSphere https://github.com/mrdoob/three.js/blob/dev/src/math/Box3.js#L518

	clampPoint(point: Vector3, target: Vector3) {
		return target.copy(point).clamp(this.min, this.max);
	}

	distanceToPoint(point: Vector3) {
		const clampedPoint = tmpV3.copy(point).clamp(this.min, this.max);
		return clampedPoint.sub(point).length;
	}

	intersection(box: Box) {
		this.min.max(box.min);
		this.max.min(box.max);
		return this;
	}

	union(box: Box) {
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

const tmpV3 = new Vector3();