import { Matrix4 } from '../math/Matrix4';
import { DEG2RAD } from '../math/util';

export abstract class Camera {
	public readonly projectionMatrix: Matrix4 = new Matrix4();
	public readonly projectionMatrixInverse: Matrix4 = new Matrix4();

	constructor() {}

	abstract updateProjectionMatrix(): void;
}

export class CameraPerspective extends Camera {
	constructor(public fov: number, public aspect: number, public near: number, public far: number, public zoom: number) {
		super();
		this.updateProjectionMatrix();
	}

	updateProjectionMatrix() {
		const near = this.near;
		const top = (near * Math.tan(DEG2RAD * 0.5 * this.fov)) / this.zoom;
		const height = top * 2;
		const width = this.aspect * height;
		const left = width * -0.5;

		this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far);
		this.projectionMatrixInverse.inverse(this.projectionMatrix);
	}
}

export class CameraOrthographic extends Camera {
	constructor(
		public left: number,
		public right: number,
		public top: number,
		public bottom: number,
		public near: number,
		public far: number,
		public zoom: number
	) {
		super();
		this.updateProjectionMatrix();
	}

	updateProjectionMatrix() {
		const dx = (this.right - this.left) / (this.zoom * 2);
		const dy = (this.top - this.bottom) / (this.zoom * 2);
		const cx = (this.right + this.left) / 2;
		const cy = (this.top + this.bottom) / 2;

		this.projectionMatrix.makeOrthographic(cx - dx, cx + dx, cy + dy, cy - dy, this.near, this.far);
		this.projectionMatrixInverse.inverse(this.projectionMatrix);
	}
}
