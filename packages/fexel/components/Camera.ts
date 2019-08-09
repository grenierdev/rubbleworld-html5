import { Component, Entity, UpdateContext } from '../Scene';
import { Camera, CameraPerspective, CameraOrthographic } from '../rendering/Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Immutable';
import { Vector3 } from '../math/Vector3';
import { Box2 } from '../math/Box2';
import { Euler } from '../math/Euler';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';
import { Matrix4 } from '../math/Matrix4';
import { RenderTarget } from '../rendering/RenderTarget';
import { RendererComponent, IRenderable, IDrawable } from './Renderer';
import { PriorityList } from '../util/PriorityList';
import { Material } from '../rendering/Material';
import { Mesh } from '../rendering/Mesh';

export enum Clear {
	Nothing = 0,
	Background = WebGLRenderingContext.COLOR_BUFFER_BIT,
	Depth = WebGLRenderingContext.DEPTH_BUFFER_BIT,
}

export class CameraEffect {
	constructor(public material: Material, public buffer: RenderTarget) {}
}

export abstract class CameraComponent extends Component implements IRenderable {
	public readonly transform: TransformComponent | undefined;
	protected renderer: RendererComponent | undefined;

	public viewport: Box2 = new Box2(Vector2.Zero.clone(), Vector2.One.clone());
	public order: number = 0;
	public backgroundColor: Color = Color.Black.clone();
	public clear: Clear = Clear.Background | Clear.Depth;
	public showDebug: boolean = false;
	public effects: CameraEffect[] = [];
	public renderTarget?: RenderTarget;

	protected effectMesh = new Mesh({
		vertices: new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]),
		indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
		uvs: [new Float32Array([1, 0, 0, 0, 1, 1, 0, 1])],
	});

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

			if (this.effects.length) {
				const firstEffect = this.effects[0];

				firstEffect.buffer.bind(gl);
				gl.enable(gl.SCISSOR_TEST);
				gl.viewport(0, 0, firstEffect.buffer.width, firstEffect.buffer.height);
				gl.scissor(0, 0, firstEffect.buffer.width, firstEffect.buffer.height);
				this.drawScene(drawables, context);

				for (let i = 0, l = this.effects.length; i < l; ++i) {
					const { buffer, material } = this.effects[i];

					const nextBuffer = i + 1 >= l ? null : this.effects[i + 1].buffer;
					if (nextBuffer) {
						nextBuffer.bind(gl);
						gl.viewport(0, 0, nextBuffer.width, nextBuffer.height);
						gl.scissor(0, 0, nextBuffer.width, nextBuffer.height);
					} else {
						this.setupViewport(width, height, context);
					}

					material.setUniform('sampler', buffer.texture);
					material.bind(gl);
					this.effectMesh.draw(gl);
				}

				this.drawDebug(context);
			} else {
				this.setupViewport(width, height, context);
				this.drawScene(drawables, context);
				this.drawDebug(context);
			}
		}
	}

	protected setupViewport(width: number, height: number, context: UpdateContext) {
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
	}

	protected drawScene(drawables: PriorityList<IDrawable>, context: UpdateContext) {
		const gl = context.gl!;
		const viewMatrix = this.transform ? this.transform.worldMatrix : Matrix4.Identity;
		const projectionMatrix = this.camera.projectionMatrix;
		const visibilityFlag = this.visibilityFlag;

		if (this.clear) {
			gl.clearColor(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b, this.backgroundColor.a);
			gl.clear(this.clear);
		}

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		for (const [drawer] of drawables) {
			drawer.draw(gl, viewMatrix, projectionMatrix, visibilityFlag);
		}
	}

	protected drawDebug(context: UpdateContext) {
		const gl = context.gl!;
		const viewMatrix = this.transform ? this.transform.worldMatrix : Matrix4.Identity;
		const projectionMatrix = this.camera.projectionMatrix;

		if (this.showDebug && context.debug) {
			context.debug.draw(viewMatrix, projectionMatrix, gl);
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
	constructor({ fov, far, near, zoom }: Omit<CameraPerspectiveConstructor, 'aspect'>) {
		super(new CameraPerspective(fov, 1.0, near, far, zoom));
	}

	render(width: number, height: number, drawables: PriorityList<IDrawable>, context: UpdateContext) {
		if (this.enabled && this.entity && this.entity.enabled) {
			(this.camera as CameraPerspective).aspect = width / height;
			this.camera.updateProjectionMatrix();
			super.render(width, height, drawables, context);
		}
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
	camera: Omit<CameraPerspectiveConstructor, 'aspect'>;
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
