import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Material, UniformMap } from '../rendering/Material';
import { Texture } from '../rendering/Texture';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Color, ReadonlyColor } from '../math/Color';
import { ShadowCasterMaterial } from '../materials/ShadowCaster';

export interface IRenderable {
	render(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext): void;
}

export interface IDrawable {
	draw(
		gl: WebGLRenderingContext,
		worldMatrix: Matrix4 | ReadonlyMatrix4,
		projectionMatrix: Matrix4 | ReadonlyMatrix4,
		visibilityFlag: number
	): void;
}

export interface LightUniform {
	type: number;
	position: Vector3 | ReadonlyVector3;
	direction: Vector3 | ReadonlyVector3;
	intensity: number;
	color: Color | ReadonlyColor;
	shadowtexture?: Texture;
	shadowtransform?: Matrix4 | ReadonlyMatrix4;
}

export interface ILight {
	getUniform(): LightUniform | undefined;
	renderShadow(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext): void;
}

export class RendererComponent extends Component {
	public executionOrder = 2000;

	public readonly drawables: PriorityList<IDrawable> = new PriorityList();
	public readonly renderables: PriorityList<IRenderable> = new PriorityList();
	public readonly lights: PriorityList<ILight> = new PriorityList();

	private shadowMaterial = new ShadowCasterMaterial();

	didMount() {
		if (!(this.entity instanceof Scene)) {
			console.warn('RendererComponent only works on Scene.');
		}
	}

	update(context: UpdateContext) {
		if (context.canvas && context.gl && this.entity instanceof Scene) {
			const width = context.canvas.width;
			const height = context.canvas.height;
			const drawables = this.drawables;

			Material.globals.Lights = [];
			const prevOverride = Material.override;
			Material.override = this.shadowMaterial;

			const lights = this.lights;
			const uniforms: LightUniform[] = [];
			for (const [light] of lights) {
				light.renderShadow(width, height, drawables, context);
				const uniform = light.getUniform();
				if (uniform) {
					uniforms.push(uniform);
				}
			}

			// Material.globals.Lights = uniforms as any;
			Material.globals.uDirectionalShadowTransform = uniforms.map(u => u.shadowtransform) as any;
			Material.globals.uDirectionalShadowMap = uniforms.map(u => u.shadowtexture) as any;
			Material.override = prevOverride;

			for (const [renderable] of this.renderables) {
				renderable.render(width, height, drawables, context);
			}
		}
	}
}
