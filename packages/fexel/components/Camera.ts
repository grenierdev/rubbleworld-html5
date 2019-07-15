import { Component, Entity } from '../Scene'; // hack circular dependency
import { Camera, CameraPerspective, CameraOrthographic } from '../rendering/Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';
import { Vector3 } from '../math/Vector3';
import { Box2 } from '../math/Box2';
import { Euler } from '../math/Euler';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';
import { Matrix4 } from '../math/Matrix4';

export enum Clear {
	Nothing = 0,
	Background = WebGLRenderingContext.COLOR_BUFFER_BIT,
	Depth = WebGLRenderingContext.DEPTH_BUFFER_BIT,
}

export abstract class CameraComponent extends Component {
	public readonly transform: TransformComponent | undefined;

	public viewport: Box2 = new Box2(Vector2.Zero.clone(), Vector2.One.clone());
	public order: number = 0;
	public backgroundColor: Color = Color.Black.clone();
	public clear: Clear = Clear.Background | Clear.Depth;

	constructor(public readonly camera: Camera) {
		super();
	}

	willMount() {
		(this as Mutable<CameraComponent>).transform = this.getComponent(TransformComponent);
	}

	update() {
		// noop;
	}

	setupViewport(gl: WebGLRenderingContext, width: number, height: number) {
		gl.viewport(
			this.viewport.min.x * width,
			this.viewport.min.y * height,
			(this.viewport.max.x - this.viewport.min.x) * width,
			(this.viewport.max.y - this.viewport.min.y) * height
		);
		if (this.clear) {
			gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
			gl.clear(this.clear);
		}
		return [this.transform ? this.transform.worldMatrix : Matrix4.Identity, this.camera.projectionMatrix];
	}
}

export interface CameraPerspectiveConstructor {
	fov: number;
	aspect: number;
	near: number;
	far: number;
	zoom: number;
}

export class CameraPerspectiveComponent extends CameraComponent {
	constructor({ fov, aspect, far, near, zoom }: CameraPerspectiveConstructor) {
		super(new CameraPerspective(fov, aspect, near, far, zoom));
	}
}

export interface CameraOrthographicConstructor {
	left: number;
	right: number;
	top: number;
	bottom: number;
	near: number;
	far: number;
	zoom: number;
}

export class CameraOrthographicComponent extends CameraComponent {
	constructor({ bottom, left, far, near, right, top, zoom }: CameraOrthographicConstructor) {
		super(new CameraOrthographic(left, right, top, bottom, near, far, zoom));
	}
}

export function CameraPerspectivePrefab({
	name = 'CameraPerspectivePrefab',
	position = Vector3.Zero.clone(),
	rotation = Euler.Zero.clone(),
	scale = Vector3.One.clone(),
	camera,
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	camera: CameraPerspectiveConstructor;
}) {
	return new Entity(name)
		.addComponent(new TransformComponent(position, rotation, scale))
		.addComponent(new CameraPerspectiveComponent(camera));
}

export function CameraOrthographicPrefab({
	name = 'CameraOrthographicPrefab',
	position = Vector3.Zero.clone(),
	rotation = Euler.Zero.clone(),
	scale = Vector3.One.clone(),
	camera,
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	camera: CameraOrthographicConstructor;
}) {
	return new Entity(name)
		.addComponent(new TransformComponent(position, rotation, scale))
		.addComponent(new CameraOrthographicComponent(camera));
}
