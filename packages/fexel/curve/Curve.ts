import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export abstract class Curve<V extends Vector2 | Vector3> {
	public arcLengthDivisions = 200;

	protected cacheArcLengths: number[] = [];

	abstract clone(): Curve<V>;
	abstract copy(curve: this): Curve<V>;
	abstract getPoint(t: number, target: V): V;

	get length() {
		const lengths = this.getLengths();
		return lengths[lengths.length - 1];
	}

	getPointAt(u: number, target: V) {
		const t = this.getUtoTmapping(u);
		return this.getPoint(t, target);
	}

	*getPoints(samples: number, target: V) {
		for (let i = 0; i < samples; ++i) {
			yield this.getPoint(i / samples, target);
		}
	}

	*getSpacedPoints(samples: number, target: V) {
		for (let i = 0; i < samples; ++i) {
			yield this.getPointAt(i / samples, target);
		}
	}

	protected abstract getLengths(divisions?: number): number[];

	getUtoTmapping(u: number, distance?: number) {
		const arcLengths = this.getLengths();

		let i = 0;
		const l = arcLengths.length;
		let low = 0;
		let high = l - 1;
		let comparison = 0;
		const targetArcLength = distance ? distance : u * arcLengths[l - 1];

		while (low <= high) {
			i = Math.floor(low + (high - low) / 2);

			comparison = arcLengths[i] - targetArcLength;

			if (comparison < 0) {
				low = i + 1;
			} else if (comparison > 0) {
				high = i - 1;
			} else {
				high = i;
				break;
			}
		}

		i = high;

		if (arcLengths[i] === targetArcLength) {
			return i / (l - 1);
		}

		const lengthBefore = arcLengths[i];
		const lengthAfter = arcLengths[i + 1];

		const segmentLength = lengthAfter - lengthBefore;

		const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

		const t = (i + segmentFraction) / (l - 1);

		return t;
	}

	abstract getTangent(t: number, target: V): V;

	getTangentAt(u: number, target: V) {
		const t = this.getUtoTmapping(u);
		return this.getTangent(t, target);
	}
}

export abstract class Curve2 extends Curve<Vector2> {
	abstract clone(): Curve2;
	abstract copy(curve: this): Curve2;

	protected getLengths(divisions = this.arcLengthDivisions) {
		if (!this.cacheArcLengths || this.cacheArcLengths.length !== divisions + 1) {
			this.cacheArcLengths = [];

			this.getPoint(0, v20);

			let sum = 0;
			for (let i = 1; i <= divisions; ++i) {
				this.getPoint(i / divisions, v21);
				sum += v21.distanceTo(v20);
				this.cacheArcLengths.push(sum);
				v20.copy(v21);
			}
		}

		return this.cacheArcLengths;
	}

	getTangent(t: number, target: Vector2) {
		const delta = 0.0001;
		let t0 = t - delta;
		let t1 = t + delta;

		if (t0 < 0) t0 = 0;
		if (t1 > 1) t1 = 1;

		this.getPoint(t0, v20);
		this.getPoint(t1, v21);

		return target.subVectors(v21, v20).normalize();
	}
}

export abstract class Curve3 extends Curve<Vector3> {
	abstract clone(): Curve3;
	abstract copy(curve: this): Curve3;

	protected getLengths(divisions = this.arcLengthDivisions) {
		if (!this.cacheArcLengths || this.cacheArcLengths.length !== divisions + 1) {
			this.cacheArcLengths = [];

			this.getPoint(0, v30);

			let sum = 0;
			for (let i = 1; i <= divisions; ++i) {
				this.getPoint(i / divisions, v31);
				sum += v31.distanceTo(v30);
				this.cacheArcLengths.push(sum);
				v30.copy(v31);
			}
		}

		return this.cacheArcLengths;
	}

	getTangent(t: number, target: Vector3) {
		const delta = 0.0001;
		let t0 = t - delta;
		let t1 = t + delta;

		if (t0 < 0) t0 = 0;
		if (t1 > 1) t1 = 1;

		this.getPoint(t0, v30);
		this.getPoint(t1, v31);

		return target.subVectors(v31, v30).normalize();
	}
}

const v20 = new Vector2();
const v21 = new Vector2();
const v30 = new Vector3();
const v31 = new Vector3();
