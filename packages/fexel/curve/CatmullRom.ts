import { Curve2, Curve3 } from './Curve';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';

export enum CatmullRomType {
	Catmullrom,
	Centripetal,
	Chordal,
}

export class CatmullRom2 extends Curve2 {
	constructor(
		public points: Vector2[] = [],
		public closed = false,
		public type = CatmullRomType.Centripetal,
		public tension = 0.5
	) {
		super();
	}

	clone() {
		return new CatmullRom2(this.points.map(p => p.clone()), this.closed, this.type, this.tension);
	}

	copy(curve: CatmullRom2) {
		this.points = curve.points.map(p => p.clone());
		this.closed = curve.closed;
		this.type = curve.type;
		this.tension = curve.tension;
		return this;
	}

	getPoint(t: number, target: Vector2) {
		const l = this.points.length;

		const p = (l - (this.closed ? 0 : 1)) * t;
		let intPoint = Math.floor(p);
		let weight = p - intPoint;

		if (this.closed) {
			intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
		} else if (weight === 0 && intPoint === l - 1) {
			intPoint = l - 2;
			weight = 1;
		}

		if (this.closed || intPoint > 0) {
			v20.copy(this.points[(intPoint - 1) % l]);
		} else {
			v20.subVectors(this.points[0], this.points[1]).add(this.points[0]);
		}

		v21.copy(this.points[intPoint % l]);
		v22.copy(this.points[(intPoint + 1) % l]);

		if (this.closed || intPoint + 2 < l) {
			v23.copy(this.points[(intPoint + 2) % l]);
		} else {
			v23.subVectors(this.points[l - 1], this.points[l - 2]).add(this.points[l - 1]);
		}

		if (this.type === CatmullRomType.Centripetal || this.type === CatmullRomType.Chordal) {
			const pow = this.type === CatmullRomType.Chordal ? 0.5 : 0.25;
			let dt0 = Math.pow(v20.distanceToSquared(v21), pow);
			let dt1 = Math.pow(v21.distanceToSquared(v22), pow);
			let dt2 = Math.pow(v22.distanceToSquared(v23), pow);

			if (dt1 < 1e-4) dt1 = 1.0;
			if (dt0 < 1e-4) dt0 = dt1;
			if (dt2 < 1e-4) dt2 = dt1;

			return target.set(
				interpolateNonuniformCatmullRom(weight, v20.x, v21.x, v22.x, v23.x, dt0, dt1, dt2),
				interpolateNonuniformCatmullRom(weight, v20.y, v21.y, v22.y, v23.y, dt0, dt1, dt2)
			);
		}

		return target.set(
			interpolateCatmullRom(weight, v20.x, v21.x, v22.x, v23.x, this.tension),
			interpolateCatmullRom(weight, v20.y, v21.y, v22.y, v23.y, this.tension)
		);
	}
}

export class CatmullRom3 extends Curve3 {
	constructor(
		public points: Vector3[] = [],
		public closed = false,
		public type = CatmullRomType.Centripetal,
		public tension = 0.5
	) {
		super();
	}

	clone() {
		return new CatmullRom3(this.points.map(p => p.clone()), this.closed, this.type, this.tension);
	}

	copy(curve: CatmullRom3) {
		this.points = curve.points.map(p => p.clone());
		this.closed = curve.closed;
		this.type = curve.type;
		this.tension = curve.tension;
		return this;
	}

	getPoint(t: number, target: Vector3) {
		const l = this.points.length;

		const p = (l - (this.closed ? 0 : 1)) * t;
		let intPoint = Math.floor(p);
		let weight = p - intPoint;

		if (this.closed) {
			intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
		} else if (weight === 0 && intPoint === l - 1) {
			intPoint = l - 2;
			weight = 1;
		}

		if (this.closed || intPoint > 0) {
			v30.copy(this.points[(intPoint - 1) % l]);
		} else {
			v30.subVectors(this.points[0], this.points[1]).add(this.points[0]);
		}

		v31.copy(this.points[intPoint % l]);
		v32.copy(this.points[(intPoint + 1) % l]);

		if (this.closed || intPoint + 2 < l) {
			v33.copy(this.points[(intPoint + 2) % l]);
		} else {
			v33.subVectors(this.points[l - 1], this.points[l - 2]).add(this.points[l - 1]);
		}

		if (this.type === CatmullRomType.Centripetal || this.type === CatmullRomType.Chordal) {
			const pow = this.type === CatmullRomType.Chordal ? 0.5 : 0.25;
			let dt0 = Math.pow(v30.distanceToSquared(v31), pow);
			let dt1 = Math.pow(v31.distanceToSquared(v32), pow);
			let dt2 = Math.pow(v32.distanceToSquared(v33), pow);

			if (dt1 < 1e-4) dt1 = 1.0;
			if (dt0 < 1e-4) dt0 = dt1;
			if (dt2 < 1e-4) dt2 = dt1;

			return target.set(
				interpolateNonuniformCatmullRom(weight, v30.x, v31.x, v32.x, v33.x, dt0, dt1, dt2),
				interpolateNonuniformCatmullRom(weight, v30.y, v31.y, v32.y, v33.y, dt0, dt1, dt2),
				interpolateNonuniformCatmullRom(weight, v30.z, v31.z, v32.z, v33.z, dt0, dt1, dt2)
			);
		}

		return target.set(
			interpolateCatmullRom(weight, v30.x, v31.x, v32.x, v33.x, this.tension),
			interpolateCatmullRom(weight, v30.y, v31.y, v32.y, v33.y, this.tension),
			interpolateCatmullRom(weight, v30.z, v31.z, v32.z, v33.z, this.tension)
		);
	}
}

export function interpolateCatmullRom(t: number, x0: number, x1: number, x2: number, x3: number, tension: number) {
	const t0 = tension * (x2 - x0);
	const t1 = tension * (x3 - x1);
	const t2 = t * t;
	const t3 = t2 * t;
	const c0 = x1;
	const c1 = t0;
	const c2 = -3 * x1 + 3 * x2 - 2 * t0 - t1;
	const c3 = 2 * x1 - 2 * x2 + t0 + t1;
	return c0 + c1 * t + c2 * t2 + c3 * t3;
}

export function interpolateNonuniformCatmullRom(
	t: number,
	x0: number,
	x1: number,
	x2: number,
	x3: number,
	dt0: number,
	dt1: number,
	dt2: number
) {
	const t0 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
	const t1 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
	const t2 = t * t;
	const t3 = t2 * t;
	const c0 = x1;
	const c1 = t0;
	const c2 = -3 * x1 + 3 * x2 - 2 * t0 - t1;
	const c3 = 2 * x1 - 2 * x2 + t0 + t1;
	return c0 + c1 * t + c2 * t2 + c3 * t3;
}

const v20 = new Vector2();
const v21 = new Vector2();
const v22 = new Vector2();
const v23 = new Vector2();
const v30 = new Vector3();
const v31 = new Vector3();
const v32 = new Vector3();
const v33 = new Vector3();
