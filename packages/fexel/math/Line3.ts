import { Vector3, ReadonlyVector3 } from './Vector3';
import { clamp } from './util';

export class Line3 {
	constructor(public start = new Vector3(), public end = new Vector3()) {}

	getCenter(target: Vector3) {
		return target.addVectors(this.start, this.end).multiplyScalar(0.5);
	}

	equals(line: Line3 | ReadonlyLine3) {
		return this.start.equals(line.start) && this.end.equals(line.end);
	}

	set(start: Vector3 | ReadonlyVector3, end: Vector3 | ReadonlyVector3) {
		this.start.copy(start);
		this.end.copy(end);
		return this;
	}

	clone() {
		return new Line3(this.start.clone(), this.end.clone());
	}

	copy(line: Line3 | ReadonlyLine3) {
		this.start.copy(line.start);
		this.end.copy(line.end);
		return this;
	}

	delta(target: Vector3) {
		return target.subVectors(this.end, this.start);
	}

	distanceSquared() {
		return this.start.distanceToSquared(this.end);
	}

	distance() {
		return this.start.distanceTo(this.end);
	}

	at(t: number, target: Vector3) {
		return this.delta(target)
			.multiplyScalar(t)
			.add(this.start);
	}

	closestPointToPointParameter(point: Vector3 | ReadonlyVector3, clampToLine = true) {
		v0.subVectors(point, this.start);
		v1.subVectors(this.end, this.start);

		const dotv11 = v1.dot(v1);
		const dotv10 = v1.dot(v0);

		let t = dotv10 / dotv11;
		if (clampToLine) {
			t = clamp(t, 0, 1);
		}
		return t;
	}

	closestPointToPoint(point: Vector3 | ReadonlyVector3, target: Vector3, clampToLine = true) {
		const t = this.closestPointToPointParameter(point, clampToLine);
		return this.delta(target)
			.multiplyScalar(t)
			.add(this.start);
	}
}

export type ReadonlyLine3 = Pick<
	Line3,
	| 'getCenter'
	| 'equals'
	| 'clone'
	| 'delta'
	| 'distanceSquared'
	| 'distance'
	| 'closestPointToPointParameter'
	| 'closestPointToPoint'
> & { readonly start: ReadonlyVector3; readonly end: ReadonlyVector3 };

const v0 = new Vector3();
const v1 = new Vector3();
