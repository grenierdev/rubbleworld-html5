import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Line2, Line3 } from './Line';
import { Vector3 } from '../math/Vector3';

export class Path2 extends Curve2 {
	protected cacheLengths: number[] = [];

	constructor(public curves: Curve2[] = [], public autoClose = false) {
		super();
	}

	get length() {
		const lengths = this.getCurveLengths();
		return lengths[lengths.length - 1];
	}

	protected getCurveLengths() {
		if (this.cacheLengths.length !== this.curves.length) {
			this.cacheLengths = [];
			for (let i = 0, l = this.curves.length, sums = 0; i < l; ++i) {
				sums += this.curves[i].length;
				this.cacheLengths.push(sums);
			}
		}
		return this.cacheLengths;
	}

	clone() {
		return new Path2(this.curves.map(c => c.clone()));
	}

	copy(path: Path2) {
		this.curves = path.curves.map(c => c.clone());
		this.cacheArcLengths = [];
		return this;
	}

	add(...curves: Curve2[]) {
		this.curves.push(...curves);
		this.cacheArcLengths = [];
		return this;
	}

	close() {
		this.curves[0].getPoint(0, v20);
		this.curves[this.curves.length - 1].getPoint(1, v21);
		if (!v20.equals(v21)) {
			return this.add(new Line2(v20, v21));
		}
		return this;
	}

	getPoint(t: number, target: Vector2) {
		const d = t * this.length;
		const curveLengths = this.getCurveLengths();
		const l = curveLengths.length;
		let i = 0;

		while (i < l) {
			if (curveLengths[i] >= d) {
				const diff = curveLengths[i] - d;
				const curve = this.curves[i];

				const segmentLength = curve.length;
				const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

				return curve.getPointAt(u, target);
			}

			i++;
		}

		return target;
	}

	getPoints(targets: Vector2[]) {
		const l = this.autoClose ? targets.length - 1 : targets.length;

		for (var i = 0; i < l; ++i) {
			this.getPoint(i / l, targets[i]);
		}

		if (this.autoClose) {
			targets[targets.length - 1] = targets[0];
		}

		return targets;
	}

	getSpacedPoints(targets: Vector2[]) {
		const l = this.autoClose ? targets.length - 1 : targets.length;

		for (let i = 0; i < l; ++i) {
			this.getPointAt(i / l, targets[i]);
		}

		if (this.autoClose) {
			targets[targets.length - 1] = targets[0];
		}

		return targets;
	}
}

export class Path3 extends Curve3 {
	protected cacheLengths: number[] = [];

	constructor(public curves: Curve3[] = [], public autoClose = false) {
		super();
	}

	get length() {
		const lengths = this.getCurveLengths();
		return lengths[lengths.length - 1];
	}

	protected getCurveLengths() {
		if (this.cacheLengths.length !== this.curves.length) {
			this.cacheLengths = [];
			for (let i = 0, l = this.curves.length, sums = 0; i < l; ++i) {
				sums += this.curves[i].length;
				this.cacheLengths.push(sums);
			}
		}
		return this.cacheLengths;
	}

	clone() {
		return new Path3(this.curves.map(c => c.clone()));
	}

	copy(path: Path3) {
		this.curves = path.curves.map(c => c.clone());
		this.cacheArcLengths = [];
		return this;
	}

	add(...curves: Curve3[]) {
		this.curves.push(...curves);
		return this;
	}

	close() {
		this.curves[0].getPoint(0, v30);
		this.curves[this.curves.length - 1].getPoint(1, v31);
		if (!v30.equals(v31)) {
			return this.add(new Line3(v30, v31));
		}
		return this;
	}

	getPoint(t: number, target: Vector3) {
		const d = t * this.length;
		const curveLengths = this.getCurveLengths();
		const l = curveLengths.length;
		let i = 0;

		while (i < l) {
			if (curveLengths[i] >= d) {
				const diff = curveLengths[i] - d;
				const curve = this.curves[i];

				const segmentLength = curve.length;
				const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

				return curve.getPointAt(u, target);
			}

			i++;
		}

		return target;
	}

	getPoints(targets: Vector3[]) {
		const l = this.autoClose ? targets.length - 1 : targets.length;

		for (var i = 0; i < l; ++i) {
			this.getPoint(i / l, targets[i]);
		}

		if (this.autoClose) {
			targets[targets.length - 1] = targets[0];
		}

		return targets;
	}

	getSpacedPoints(targets: Vector3[]) {
		const l = this.autoClose ? targets.length - 1 : targets.length;

		for (let i = 0; i < l; ++i) {
			this.getPointAt(i / l, targets[i]);
		}

		if (this.autoClose) {
			targets[targets.length - 1] = targets[0];
		}

		return targets;
	}
}

const v20 = new Vector2();
const v21 = new Vector2();
const v30 = new Vector3();
const v31 = new Vector3();
