import { Vector3 } from './Vector3';
import { clamp } from './util';

export class Line {
	constructor(public start = new Vector3(), public end = new Vector3()) {}

	getCenter(target: Vector3) {
		return target.addVectors(this.start, this.end).multiplyScalar(0.5);
	}

	equals(line: Line) {
		return this.start.equals(line.start) && this.end.equals(line.end);
	}

	set(start: Vector3, end: Vector3) {
		this.start.copy(start);
		this.end.copy(end);
		return this;
	}

	clone() {
		return new Line(this.start.clone(), this.end.clone());
	}

	copy(line: Line) {
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

	closestPointToPointParameter(point: Vector3, clampToLine = true) {
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

	closestPointToPoint(point: Vector3, target: Vector3, clampToLine = true) {
		const t = this.closestPointToPointParameter(point, clampToLine);
		return this.delta(target)
			.multiplyScalar(t)
			.add(this.start);
	}
}

const v0 = new Vector3();
const v1 = new Vector3();
