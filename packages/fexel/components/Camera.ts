import { Component, Entity, UpdateContext } from '../Scene';
import { Camera, CameraPerspective, CameraOrthographic } from '../rendering/Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';
import { Vector3 } from '../math/Vector3';
import { Box2 } from '../math/Box2';
import { Euler } from '../math/Euler';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';
import { Matrix4 } from '../math/Matrix4';
import { RenderTarget } from '../rendering/RenderTarget';
import { RendererComponent, IRenderable, IDrawable } from './Renderer';
import { MeshRendererComponent } from './MeshRenderer';
import { PriorityList } from '../util/PriorityList';

export enum Clear {
	Nothing = 0,
	Background = WebGLRenderingContext.COLOR_BUFFER_BIT,
	Depth = WebGLRenderingContext.DEPTH_BUFFER_BIT,
}

export abstract class CameraComponent extends Component implements IRenderable {
	public readonly transform: TransformComponent | undefined;
	protected renderer: RendererComponent | undefined;

	public viewport: Box2 = new Box2(Vector2.Zero.clone(), Vector2.One.clone());
	public order: number = 0;
	public backgroundColor: Color = Color.Black.clone();
	public clear: Clear = Clear.Background | Clear.Depth;
	public showDebug: boolean = false;
	public renderTarget?: RenderTarget;

	constructor(public readonly camera: Camera, public visibilityFlag: number = 0xff) {
		super();
	}

	didMount() {
		(this as Mutable<CameraComponent>).transform = this.getComponent(TransformComponent);

		const scene = this.entity!.scene;
		this.renderer = scene ? scene.getComponent(RendererComponent) : undefined;
		if (this.renderer) {
			this.renderer.renderables.add(this, this.order);
		}
	}

	willUnmount() {
		if (this.renderer) {
			this.renderer.renderables.remove(this);
		}
	}

	render(width: number, height: number, drawables: PriorityList<IDrawable>, context: UpdateContext) {
		if (this.enabled && this.entity && this.entity.enabled) {
			const gl = context.gl!;

			gl.enable(gl.SCISSOR_TEST);
			if (this.renderTarget) {
				this.renderTarget.bind(gl);
				gl.viewport(0, 0, this.renderTarget.width, this.renderTarget.height);
				gl.scissor(0, 0, this.renderTarget.width, this.renderTarget.height);
			} else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.viewport(
					this.viewport.min.x * width,
					this.viewport.min.y * height,
					(this.viewport.max.x - this.viewport.min.x) * width,
					(this.viewport.max.y - this.viewport.min.y) * height
				);
				gl.scissor(
					this.viewport.min.x * width,
					this.viewport.min.y * height,
					(this.viewport.max.x - this.viewport.min.x) * width,
					(this.viewport.max.y - this.viewport.min.y) * height
				);
			}

			if (this.clear) {
				gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
				gl.clear(this.clear);
			}

			gl.enable(gl.CULL_FACE);
			gl.enable(gl.DEPTH_TEST);

			const viewMatrix = this.transform ? this.transform.worldMatrix : Matrix4.Identity;
			const projectionMatrix = this.camera.projectionMatrix;
			const visibilityFlag = this.visibilityFlag;
			for (const [drawer] of drawables) {
				drawer.draw(gl, viewMatrix, projectionMatrix, visibilityFlag);
			}
			if (this.showDebug && context.debug) {
				context.debug.draw(viewMatrix, projectionMatrix, gl);
			}
		}
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
	return new Entity(name, [new TransformComponent(position, rotation, scale), new CameraPerspectiveComponent(camera)]);
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
	return new Entity(name, [new TransformComponent(position, rotation, scale), new CameraOrthographicComponent(camera)]);
}
