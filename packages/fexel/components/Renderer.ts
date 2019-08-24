import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Material, UniformMap, UniformPrimitive } from '../rendering/Material';
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

export interface LightUniform extends UniformMap {
	Type: number;
	Position: Vector3 | ReadonlyVector3;
	Direction: Vector3 | ReadonlyVector3;
	Color: Color | ReadonlyColor;
	ShadowMap?: Texture;
	ShadowMapMatrix?: Matrix4 | ReadonlyMatrix4;
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

			Material.globals.uLights = [];
			Material.globals.uDirectionalShadowTransform = [];
			Material.globals.uDirectionalShadowMap = [];
			const prevOverride = Material.override;
			Material.override = this.shadowMaterial;

			const lightComponents = this.lights;
			const lights: LightUniform[] = [];
			for (const [light] of lightComponents) {
				light.renderShadow(width, height, drawables, context);
				const uniform = light.getUniform();
				if (uniform) {
					lights.push(uniform);
				}
			}

			for (const light of lights) {
				(Material.globals.uLights as UniformMap[]).push(light);
				if (light.Type === 1) {
					(Material.globals.uDirectionalShadowTransform as UniformPrimitive[]).push(light.ShadowMapMatrix!);
					(Material.globals.uDirectionalShadowMap as UniformPrimitive[]).push(light.ShadowMap!);
				}
			}

			Material.override = prevOverride;

			for (const [renderable] of this.renderables) {
				renderable.render(width, height, drawables, context);
			}
		}
	}
}
