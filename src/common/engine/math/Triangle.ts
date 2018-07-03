import { Vector3, Plane, Box } from ".";

export class Triangle {
	constructor(
		public a = new Vector3(),
		public b = new Vector3(),
		public c = new Vector3(),
	) {

	}

	equals(triangle: Triangle) {
		return this.a.equals(triangle.a) && this.b.equals(triangle.b) && this.c.equals(triangle.c);
	}

	set(a: Vector3, b: Vector3, c: Vector3) {
		this.a.copy(a);
		this.b.copy(b);
		this.c.copy(c);
		return this;
	}

	clone() {
		return new Triangle(this.a.clone(), this.b.clone(), this.c.clone());
	}

	copy(triangle: Triangle) {
		this.a.copy(triangle.a);
		this.b.copy(triangle.b);
		this.c.copy(triangle.c);
		return this;
	}

	getArea() {
		v0.subVectors(this.c, this.b);
		v1.subVectors(this.a, this.b);
		return v0.cross(v1).length * 0.5;
	}

	getMidpoint(target: Vector3) {
		return target.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
	}

	getNormal(target: Vector3) {
		return Triangle.getNormal(this.a, this.b, this.c, target);
	}

	getPlane(target: Plane) {
		return target.setFromCoplanarPoints(this.a, this.b, this.c);
	}

	getBarycoord(point: Vector3, target: Vector3) {
		return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
	}

	containsPoint(point: Vector3) {
		return Triangle.containsPoint(point, this.a, this.b, this.c);
	}

	intersectsBox(box: Box) {
		return box.intersectsTriangle(this);
	}

	closestPointToPoint(point: Vector3, target: Vector3) {
		const a = this.a;
		const b = this.b;
		const c = this.c;
		let v = 0;
		let w = 0;

		vab.subVectors(b, a);
		vac.subVectors(c, a);
		vap.subVectors(point, a);
		const d1 = vab.dot(vap);
		const d2 = vac.dot(vap);
		if (d1 <= 0 && d2 <= 0) {
			return target.copy(a);
		}

		vbp.subVectors(point, b);
		const d3 = vab.dot(vbp);
		const d4 = vac.dot(vbp);
		if (d3 >= 0 && d4 <= d3) {
			return target.copy(b);
		}

		const vc = d1 * d4 - d3 * d2;
		if (vc <= 0 && d1 >= 0 && d3 <= 0) {
			v = d1 / (d1 - d3);
			return target.copy(a).add(vab.multiplyScalar(v));
		}

		vcp.subVectors(point, c);
		const d5 = vab.dot(vcp);
		const d6 = vac.dot(vcp);
		if (d6 >= 0 && d5 <= d6) {
			return target.copy(c);
		}

		const vb = d5 * d2 - d1 * d6;
		if (vb <= 0 && d2 >= 0 && d6 <= 0) {
			w = d2 / (d2 - d6);
			return target.copy(a).add(vac.multiplyScalar(w));

		}

		const va = d3 * d6 - d5 * d4;
		if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
			vbc.subVectors(c, b);
			w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
			return target.copy(b).add(vbc.multiplyScalar(w));

		}

		const denom = 1 / (va + vb + vc);
		// u = va * denom
		v = vb * denom;
		w = vc * denom;
		return target.copy(a).add(vab.multiplyScalar(v)).add(vac.multiplyScalar(w));
	}

	static getNormal(a: Vector3, b: Vector3, c: Vector3, target: Vector3) {
		target.subVectors(c, b);
		v0.subVectors(a, b);
		target.cross(v0);

		const targetLengthSq = target.lengthSquared;
		if (targetLengthSq > 0) {
			return target.multiplyScalar(1 / Math.sqrt(targetLengthSq));
		}
		return target.set(0, 0, 0);
	}

	static getBarycoord(point: Vector3, a: Vector3, b: Vector3, c: Vector3, target: Vector3) {
		v0.subVectors(c, a);
		v1.subVectors(b, a);
		v2.subVectors(point, a);

		const dot00 = v0.dot(v0);
		const dot01 = v0.dot(v1);
		const dot02 = v0.dot(v2);
		const dot11 = v1.dot(v1);
		const dot12 = v1.dot(v2);

		const denom = dot00 * dot11 - dot01 * dot01;

		if (denom === 0) {
			return target.set(-2, -1, -1);
		}

		const invDenom = 1 / denom;
		const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		return target.set(1 - u - v, v, u);
	}

	static containsPoint(point: Vector3, a: Vector3, b: Vector3, c: Vector3) {
		Triangle.getBarycoord(point, a, b, c, v0);
		return (v1.x >= 0) && (v1.y >= 0) && ((v1.x + v1.y) <= 1);
	}
}

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();

const vab = new Vector3();
const vac = new Vector3();
const vbc = new Vector3();
const vap = new Vector3();
const vbp = new Vector3();
const vcp = new Vector3();