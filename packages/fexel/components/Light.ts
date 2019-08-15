import { Component, UpdateContext } from '../Scene';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Immutable';
import { Light, DirectionalLight, SpotLight, PointLight } from '../rendering/Light';
import { Color } from '../math/Color';
import { Vector3 } from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';
import { DEG2RAD } from '../math/util';
import { RendererComponent, IDrawable, LightUniform } from './Renderer';
import { PriorityList } from '../util/PriorityList';
import { Vector2 } from '../math/Vector2';
import { RenderTarget, RenderTargetAttachment } from '../rendering/RenderTarget';
import { Texture } from '../rendering/Texture';
import { CameraVisibility } from './Camera';
import { CameraOrthographic } from '../rendering/Camera';

export abstract class LightComponent extends Component {
	public readonly transform: TransformComponent | undefined;
	protected renderer: RendererComponent | undefined;

	public shadowTarget?: RenderTarget;
	protected shadowColorMap?: Texture;

	constructor(
		public readonly light: Light,
		public shadowMap?: Texture,
		public visibilityFlag: number = CameraVisibility.Everything
	) {
		super();
	}

	didMount() {
		(this as Mutable<LightComponent>).transform = this.getComponent(TransformComponent);

		const scene = this.entity!.scene;
		this.renderer = scene ? scene.getComponent(RendererComponent) : undefined;
		if (this.renderer) {
			this.renderer.lights.add(this, 0);
		}
	}

	willUnmount() {
		if (this.renderer) {
			this.renderer.lights.remove(this);
		}
	}

	createShadowMap(gl: WebGLRenderingContext) {
		if (!this.shadowTarget && this.shadowMap) {
			this.shadowTarget = new RenderTarget(
				this.shadowMap.width!,
				this.shadowMap.height!,
				new Map([
					// [
					// 	RenderTargetAttachment.COLOR0,
					// 	new Texture({ width: this.shadowMap.width!, height: this.shadowMap.height! }),
					// ],
					// [RenderTargetAttachment.DEPTH, this.shadowMap],
					[RenderTargetAttachment.COLOR0, this.shadowMap],
				])
			);
		}
	}

	abstract getUniform(): LightUniform | undefined;

	abstract renderShadow(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext): void;
}

export interface DirectionalLightConstructor {
	intensity?: number;
	color?: Color;
	near?: number;
	far?: number;
	shadowMap?: Texture;
}

export class DirectionalLightComponent extends LightComponent {
	protected readonly camera: CameraOrthographic;

	constructor({ intensity, color, shadowMap }: DirectionalLightConstructor, public near = 0.01, public far = 2000) {
		super(new DirectionalLight(Vector3.Zero.clone(), intensity, color), shadowMap);
		this.camera = new CameraOrthographic(-5, 5, -5, 5, near, far, 1);
	}

	getUniform() {
		const light = this.light as DirectionalLight;
		const uniform: LightUniform = {
			type: 0,
			position: Vector3.Zero,
			direction: light.direction,
			intensity: light.intensity,
			color: light.color,
			shadowtexture: this.shadowMap || Texture.EmptyDepth,
			shadowtransform: this.shadowMap
				? m0.multiplyMatrices(
						this.transform ? this.transform.worldMatrixInverse : Matrix4.Identity,
						this.camera.projectionMatrix
				  )
				: undefined,
		};
		return uniform;
	}

	renderShadow(width: number, height: number, drawables: PriorityList<IDrawable>, context: UpdateContext) {
		if (context.gl && this.enabled && this.entity!.enabled && this.shadowMap && this.transform) {
			const gl = context.gl;
			const worldMatrix = this.transform ? this.transform.worldMatrixInverse : Matrix4.Identity;
			this.camera.updateProjectionMatrix();
			const projectionMatrix = this.camera.projectionMatrix;
			const visibilityFlag = this.visibilityFlag;

			this.createShadowMap(gl);

			this.shadowTarget!.bind(gl);
			gl.viewport(0, 0, this.shadowTarget!.width, this.shadowTarget!.height);
			gl.scissor(0, 0, this.shadowTarget!.width, this.shadowTarget!.height);
			gl.clearColor(0, 0, 0, 1);
			gl.clearDepth(1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			for (const [drawer] of drawables) {
				drawer.draw(gl, worldMatrix, projectionMatrix, visibilityFlag);
			}
		}
	}
}

export interface SpotConstructorLight {
	angle: number;
	range: number;
	intensity?: number;
	color?: Color;
	shadowMap?: Texture;
}

export class SpotComponentLight extends LightComponent {
	protected readonly projectionMatrix: Matrix4 = new Matrix4();

	constructor(
		{ angle, range, intensity, color, shadowMap }: SpotConstructorLight,
		public near = 0.01,
		public far = 2000
	) {
		super(new SpotLight(Vector3.Zero.clone(), Vector3.Zero.clone(), angle, range, intensity, color), shadowMap);
	}

	updateProjectionMatrix() {
		const light = this.light as SpotLight;
		const near = this.near;
		const top = near * Math.tan(DEG2RAD * light.angle);
		const height = top * 2;
		const width = height;
		const left = width * -0.5;

		this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far);
	}

	getUniform() {
		return undefined;
	}

	renderShadow(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext) {
		if (this.enabled && this.entity!.enabled && this.shadowMap && this.transform) {
			debugger;
		}
	}
}

export interface PointConstructorLight {
	range: number;
	intensity?: number;
	color?: Color;
}

export class PointComponentLight extends LightComponent {
	constructor({ range, intensity, color }: PointConstructorLight) {
		super(new PointLight(Vector3.Zero.clone(), range, intensity, color));
	}

	getUniform() {
		return undefined;
	}

	renderShadow(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext) {
		if (this.enabled && this.entity!.enabled && this.shadowMap && this.transform) {
			debugger;
		}
	}
}

const m0 = new Matrix4();
