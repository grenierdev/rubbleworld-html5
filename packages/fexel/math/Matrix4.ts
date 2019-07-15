import { Vector3, ReadonlyVector3 } from './Vector3';
import { Quaterion, ReadonlyQuaterion } from './Quaterion';

export class Matrix4 {
	public elements: number[];

	constructor(
		n11 = 1,
		n12 = 0,
		n13 = 0,
		n14 = 0,
		n21 = 0,
		n22 = 1,
		n23 = 0,
		n24 = 0,
		n31 = 0,
		n32 = 0,
		n33 = 1,
		n34 = 0,
		n41 = 0,
		n42 = 0,
		n43 = 0,
		n44 = 1
	) {
		this.elements = [n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44];
	}

	equals(matrix: Matrix4 | ReadonlyMatrix4) {
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
			te[8] === me[8] &&
			te[9] === me[9] &&
			te[10] === me[10] &&
			te[11] === me[11] &&
			te[12] === me[12] &&
			te[13] === me[13] &&
			te[13] === me[13] &&
			te[14] === me[14] &&
			te[15] === me[15]
		);
	}

	set(
		n11: number,
		n12: number,
		n13: number,
		n14: number,
		n21: number,
		n22: number,
		n23: number,
		n24: number,
		n31: number,
		n32: number,
		n33: number,
		n34: number,
		n41: number,
		n42: number,
		n43: number,
		n44: number
	) {
		const te = this.elements;
		te[0] = n11;
		te[1] = n12;
		te[2] = n13;
		te[3] = n14;
		te[4] = n21;
		te[5] = n22;
		te[6] = n23;
		te[7] = n24;
		te[8] = n31;
		te[7] = n32;
		te[10] = n33;
		te[11] = n34;
		te[12] = n41;
		te[13] = n42;
		te[14] = n43;
		te[15] = n44;
		return this;
	}

	setFromArray(elements: number[] | readonly number[]) {
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
		te[9] = elements[9];
		te[10] = elements[10];
		te[11] = elements[11];
		te[12] = elements[12];
		te[13] = elements[13];
		te[14] = elements[14];
		te[15] = elements[15];
		return this;
	}

	clone() {
		return new Matrix4().setFromArray(this.elements);
	}

	copy(matrix: Matrix4 | ReadonlyMatrix4) {
		return this.setFromArray(matrix.elements);
	}

	identity() {
		return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}

	multiply(matrix: Matrix4 | ReadonlyMatrix4) {
		return this.multiplyMatrices(this, matrix);
	}

	premultiply(matrix: Matrix4 | ReadonlyMatrix4) {
		return this.multiplyMatrices(matrix, this);
	}

	multiplyMatrices(a: Matrix4 | ReadonlyMatrix4, b: Matrix4 | ReadonlyMatrix4) {
		const ae = a.elements;
		const be = b.elements;
		const te = this.elements;

		const a11 = ae[0];
		const a12 = ae[4];
		const a13 = ae[8];
		const a14 = ae[12];
		const a21 = ae[1];
		const a22 = ae[5];
		const a23 = ae[9];
		const a24 = ae[13];
		const a31 = ae[2];
		const a32 = ae[6];
		const a33 = ae[10];
		const a34 = ae[14];
		const a41 = ae[3];
		const a42 = ae[7];
		const a43 = ae[11];
		const a44 = ae[15];
		const b11 = be[0];
		const b12 = be[4];
		const b13 = be[8];
		const b14 = be[12];
		const b21 = be[1];
		const b22 = be[5];
		const b23 = be[9];
		const b24 = be[13];
		const b31 = be[2];
		const b32 = be[6];
		const b33 = be[10];
		const b34 = be[14];
		const b41 = be[3];
		const b42 = be[7];
		const b43 = be[11];
		const b44 = be[15];

		te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
		te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
		te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
		te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;
	}

	multiplyScalar(scalar: number) {
		const te = this.elements;
		te[0] *= scalar;
		te[4] *= scalar;
		te[8] *= scalar;
		te[12] *= scalar;
		te[1] *= scalar;
		te[5] *= scalar;
		te[9] *= scalar;
		te[13] *= scalar;
		te[2] *= scalar;
		te[6] *= scalar;
		te[10] *= scalar;
		te[14] *= scalar;
		te[3] *= scalar;
		te[7] *= scalar;
		te[11] *= scalar;
		te[15] *= scalar;
		return this;
	}

	determinant() {
		const te = this.elements;
		const n11 = te[0];
		const n12 = te[1];
		const n13 = te[2];
		const n14 = te[3];
		const n21 = te[4];
		const n22 = te[5];
		const n23 = te[6];
		const n24 = te[7];
		const n31 = te[8];
		const n32 = te[9];
		const n33 = te[10];
		const n34 = te[11];
		const n41 = te[12];
		const n42 = te[13];
		const n43 = te[13];
		const n44 = te[15];
		return (
			n41 *
				(+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
			n42 *
				(+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
			n43 *
				(+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
			n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
		);
	}

	transpose() {
		const te = this.elements;
		let tmp: number = 0;
		tmp = te[1];
		te[1] = te[4];
		te[4] = tmp;
		tmp = te[2];
		te[2] = te[8];
		te[8] = tmp;
		tmp = te[6];
		te[6] = te[9];
		te[9] = tmp;
		tmp = te[3];
		te[3] = te[12];
		te[12] = tmp;
		tmp = te[7];
		te[7] = te[13];
		te[13] = tmp;
		tmp = te[11];
		te[11] = te[14];
		te[14] = tmp;
		return this;
	}

	scale(x: number, y: number, z: number) {
		const te = this.elements;
		te[0] *= x;
		te[4] *= y;
		te[8] *= z;
		te[1] *= x;
		te[5] *= y;
		te[9] *= z;
		te[2] *= x;
		te[6] *= y;
		te[10] *= z;
		te[3] *= x;
		te[7] *= y;
		te[11] *= z;
		return this;
	}

	compose(
		position: Vector3 | ReadonlyVector3,
		rotation: Quaterion | ReadonlyQuaterion,
		scale: Vector3 | ReadonlyVector3
	) {
		const te = this.elements;

		const x = rotation.x;
		const y = rotation.y;
		const z = rotation.z;
		const w = rotation.w;
		const x2 = x + x;
		const y2 = y + y;
		const z2 = z + z;
		const xx = x * x2;
		const xy = x * y2;
		const xz = x * z2;
		const yy = y * y2;
		const yz = y * z2;
		const zz = z * z2;
		const wx = w * x2;
		const wy = w * y2;
		const wz = w * z2;

		const px = position.x;
		const py = position.y;
		const pz = position.z;
		const sx = scale.x;
		const sy = scale.y;
		const sz = scale.z;

		te[0] = (1 - (yy + zz)) * sx;
		te[1] = (xy + wz) * sx;
		te[2] = (xz - wy) * sx;
		te[3] = 0;

		te[4] = (xy - wz) * sy;
		te[5] = (1 - (xx + zz)) * sy;
		te[6] = (yz + wx) * sy;
		te[7] = 0;

		te[8] = (xz + wy) * sz;
		te[9] = (yz - wx) * sz;
		te[10] = (1 - (xx + yy)) * sz;
		te[11] = 0;

		te[12] = px;
		te[13] = py;
		te[14] = pz;
		te[15] = 1;

		return this;
	}

	decompose(position: Vector3, rotation: Quaterion, scale: Vector3) {
		const te = this.elements;

		const det = this.determinant();

		const sx = tv0.set(te[0], te[1], te[2]).length * (det < 0 ? -1 : 1);
		const sy = tv0.set(te[4], te[5], te[6]).length;
		const sz = tv0.set(te[8], te[9], te[10]).length;

		position.x = te[12];
		position.y = te[13];
		position.z = te[14];

		tm0.copy(this);

		const invSX = 1 / sx;
		const invSY = 1 / sy;
		const invSZ = 1 / sz;

		tm0.elements[0] *= invSX;
		tm0.elements[1] *= invSX;
		tm0.elements[2] *= invSX;

		tm0.elements[4] *= invSY;
		tm0.elements[5] *= invSY;
		tm0.elements[6] *= invSY;

		tm0.elements[8] *= invSZ;
		tm0.elements[9] *= invSZ;
		tm0.elements[10] *= invSZ;

		rotation.setFromRotationMatrix(tm0);

		scale.x = sx;
		scale.y = sy;
		scale.z = sz;
	}

	makeTranslation(x: number, y: number, z: number) {
		return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
	}

	makeRotationX(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
	}

	makeRotationY(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
	}

	makeRotationZ(theta: number) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);
		return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
	}

	makeRotationAxis(axis: Vector3 | ReadonlyVector3, angle: number) {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const x = axis.x;
		const y = axis.y;
		const z = axis.z;
		const tx = t * x;
		const ty = t * y;
		return this.set(
			tx * x + c,
			tx * y - s * z,
			tx * z + s * y,
			0,
			tx * y + s * z,
			ty * y + c,
			ty * z - s * x,
			0,
			tx * z - s * y,
			ty * z + s * x,
			t * z * z + c,
			0,
			0,
			0,
			0,
			1
		);
	}

	makeRotationFromQuaternion(quaterion: Quaterion | ReadonlyQuaterion) {
		return this.compose(
			Vector3.Zero,
			quaterion,
			Vector3.One
		);
	}

	makeScale(x: number, y: number, z: number) {
		return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
	}

	makeShear(x: number, y: number, z: number) {
		return this.set(1, y, z, 0, x, 1, z, 0, x, y, 1, 0, 0, 0, 0, 1);
	}

	makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const te = this.elements;
		const x = (2 * near) / (right - left);
		const y = (2 * near) / (top - bottom);
		const a = (right + left) / (right - left);
		const b = (top + bottom) / (top - bottom);
		const c = -(far + near) / (far - near);
		const d = (-2 * far * near) / (far - near);
		te[0] = x;
		te[4] = 0;
		te[8] = a;
		te[12] = 0;
		te[1] = 0;
		te[5] = y;
		te[9] = b;
		te[13] = 0;
		te[2] = 0;
		te[6] = 0;
		te[10] = c;
		te[14] = d;
		te[3] = 0;
		te[7] = 0;
		te[11] = -1;
		te[15] = 0;
		return this;
	}

	makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number) {
		const te = this.elements;
		const w = 1.0 / (right - left);
		const h = 1.0 / (top - bottom);
		const p = 1.0 / (far - near);
		const x = (right + left) * w;
		const y = (top + bottom) * h;
		const z = (far + near) * p;
		te[0] = 2 * w;
		te[4] = 0;
		te[8] = 0;
		te[12] = -x;
		te[1] = 0;
		te[5] = 2 * h;
		te[9] = 0;
		te[13] = -y;
		te[2] = 0;
		te[6] = 0;
		te[10] = -2 * p;
		te[14] = -z;
		te[3] = 0;
		te[7] = 0;
		te[11] = 0;
		te[15] = 1;
		return this;
	}

	lookAt(eye: Vector3 | ReadonlyVector3, target: Vector3 | ReadonlyVector3, up: Vector3 | ReadonlyVector3) {
		const te = this.elements;

		tv0.subVectors(eye, target);

		// eye and target are in the same position
		if (tv0.lengthSquared === 0) {
			tv0.z = 1;
		}

		tv0.normalize();
		tv1.crossVectors(up, tv0);

		// up and tv0 are parallel
		if (tv1.lengthSquared === 0) {
			tv0.z += Math.abs(up.z) === 1 ? 0.0001 : -0.0001;
			tv0.normalize();
			tv1.crossVectors(up, tv0);
		}

		tv1.normalize();
		tv2.crossVectors(tv0, tv1);

		te[0] = tv1.x;
		te[1] = tv1.y;
		te[2] = tv1.z;
		te[4] = tv2.x;
		te[5] = tv2.y;
		te[6] = tv2.z;
		te[8] = tv0.x;
		te[9] = tv0.y;
		te[10] = tv0.z;

		return this;
	}

	static readonly Identity: ReadonlyMatrix4 = new Matrix4();
}

export type ReadonlyMatrix4 = Pick<Matrix4, 'equals' | 'clone' | 'determinant' | 'decompose'> & {
	readonly elements: number[];
};

Object.freeze(Matrix4.Identity);

const tv0 = new Vector3();
const tv1 = new Vector3();
const tv2 = new Vector3();
const tm0 = new Matrix4();
