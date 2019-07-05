export class Matrix3 {
	public elements: number[];

	constructor(
		n11 = 1,
		n12 = 0,
		n13 = 0,
		n21 = 0,
		n22 = 1,
		n23 = 0,
		n31 = 0,
		n32 = 0,
		n33 = 1
	) {
		this.elements = [n11, n12, n13, n21, n22, n23, n31, n32, n33];
	}

	equals(matrix: Matrix3) {
		const te = this.elements;
		const me = matrix.elements;
		return (
			te[0] === me[0] &&
			te[1] === me[1] &&
			te[2] === me[2] &&
			te[3] === me[3] &&
			te[4] === me[4] &&
			te[5] === me[5] &&
			te[6] === me[6] &&
			te[7] === me[7] &&
			te[8] === me[8]
		);
	}

	set(
		n11: number,
		n12: number,
		n13: number,
		n21: number,
		n22: number,
		n23: number,
		n31: number,
		n32: number,
		n33: number
	) {
		const te = this.elements;
		te[0] = n11;
		te[1] = n12;
		te[2] = n13;
		te[3] = n21;
		te[4] = n22;
		te[5] = n23;
		te[6] = n31;
		te[7] = n32;
		te[8] = n33;
		return this;
	}

	setFromArray(elements: number[]) {
		const te = this.elements;
		te[0] = elements[0];
		te[1] = elements[1];
		te[2] = elements[2];
		te[3] = elements[3];
		te[4] = elements[4];
		te[5] = elements[5];
		te[6] = elements[6];
		te[7] = elements[7];
		te[8] = elements[8];
		return this;
	}

	clone() {
		return new Matrix3().setFromArray(this.elements);
	}

	copy(matrix: Matrix3) {
		return this.setFromArray(matrix.elements);
	}

	identity() {
		return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
	}

	multiply(matrix: Matrix3) {
		const ae = this.elements;
		const be = matrix.elements;
		const te = this.elements;

		const a11 = ae[0];
		const a12 = ae[1];
		const a13 = ae[2];
		const a21 = ae[3];
		const a22 = ae[4];
		const a23 = ae[5];
		const a31 = ae[6];
		const a32 = ae[7];
		const a33 = ae[8];
		const b11 = be[0];
		const b12 = be[1];
		const b13 = be[2];
		const b21 = be[3];
		const b22 = be[4];
		const b23 = be[5];
		const b31 = be[6];
		const b32 = be[7];
		const b33 = be[8];

		te[0] = a11 * b11 + a12 * b21 + a13 * b31;
		te[3] = a11 * b12 + a12 * b22 + a13 * b32;
		te[6] = a11 * b13 + a12 * b23 + a13 * b33;
		te[1] = a21 * b11 + a22 * b21 + a23 * b31;
		te[4] = a21 * b12 + a22 * b22 + a23 * b32;
		te[7] = a21 * b13 + a22 * b23 + a23 * b33;
		te[2] = a31 * b11 + a32 * b21 + a33 * b31;
		te[5] = a31 * b12 + a32 * b22 + a33 * b32;
		te[8] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;
	}

	premultiply(matrix: Matrix3) {
		const ae = matrix.elements;
		const be = this.elements;
		const te = this.elements;

		const a11 = ae[0];
		const a12 = ae[1];
		const a13 = ae[2];
		const a21 = ae[3];
		const a22 = ae[4];
		const a23 = ae[5];
		const a31 = ae[6];
		const a32 = ae[7];
		const a33 = ae[8];
		const b11 = be[0];
		const b12 = be[1];
		const b13 = be[2];
		const b21 = be[3];
		const b22 = be[4];
		const b23 = be[5];
		const b31 = be[6];
		const b32 = be[7];
		const b33 = be[8];

		te[0] = a11 * b11 + a12 * b21 + a13 * b31;
		te[3] = a11 * b12 + a12 * b22 + a13 * b32;
		te[6] = a11 * b13 + a12 * b23 + a13 * b33;
		te[1] = a21 * b11 + a22 * b21 + a23 * b31;
		te[4] = a21 * b12 + a22 * b22 + a23 * b32;
		te[7] = a21 * b13 + a22 * b23 + a23 * b33;
		te[2] = a31 * b11 + a32 * b21 + a33 * b31;
		te[5] = a31 * b12 + a32 * b22 + a33 * b32;
		te[8] = a31 * b13 + a32 * b23 + a33 * b33;

		return this;
	}

	multiplyScalar(scalar: number) {
		const te = this.elements;
		te[0] *= scalar;
		te[1] *= scalar;
		te[2] *= scalar;
		te[3] *= scalar;
		te[4] *= scalar;
		te[5] *= scalar;
		te[6] *= scalar;
		te[7] *= scalar;
		te[8] *= scalar;
		return this;
	}

	determinant() {
		const te = this.elements;
		const a = te[0];
		const b = te[1];
		const c = te[2];
		const d = te[3];
		const e = te[4];
		const f = te[5];
		const g = te[6];
		const h = te[7];
		const i = te[8];
		return (
			a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g
		);
	}

	transpose() {
		const te = this.elements;
		let tmp: number = 0;
		tmp = te[1];
		te[1] = te[3];
		te[3] = tmp;
		tmp = te[2];
		te[2] = te[6];
		te[6] = tmp;
		tmp = te[5];
		te[5] = te[7];
		te[7] = tmp;
		return this;
	}

	scale(x: number, y: number) {
		const te = this.elements;
		te[0] *= x;
		te[3] *= x;
		te[6] *= x;
		te[1] *= y;
		te[4] *= y;
		te[7] *= y;
		return this;
	}

	rotate(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		const te = this.elements;
		const a11 = te[0];
		const a12 = te[3];
		const a13 = te[6];
		const a21 = te[1];
		const a22 = te[4];
		const a23 = te[7];

		te[0] = c * a11 + s * a21;
		te[3] = c * a12 + s * a22;
		te[6] = c * a13 + s * a23;
		te[1] = -s * a11 + c * a21;
		te[4] = -s * a12 + c * a22;
		te[7] = -s * a13 + c * a23;

		return this;
	}

	translate(x: number, y: number) {
		const te = this.elements;
		te[0] += x * te[2];
		te[3] += x * te[5];
		te[6] += x * te[8];
		te[1] += y * te[2];
		te[4] += y * te[5];
		te[7] += y * te[8];
		return this;
	}

	static readonly Identity = new Matrix3();
}

Object.freeze(Matrix3.Identity);
