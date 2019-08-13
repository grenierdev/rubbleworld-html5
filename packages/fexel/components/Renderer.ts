import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { LightComponent } from './Light';
import { Material } from '../rendering/Material';

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
	position: [number, number, number];
	direction: [number, number, number];
	intensity: number;
	color: [number, number, number];
}

export interface ILight {
	getUniform(): LightUniform | undefined;
	render(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext): void;
}

export class RendererComponent extends Component {
	public executionOrder = 2000;

	public readonly drawables: PriorityList<IDrawable> = new PriorityList();
	public readonly renderables: PriorityList<IRenderable> = new PriorityList();
	public readonly lights: PriorityList<ILight> = new PriorityList();

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

			const lights = this.lights;
			const uniforms: LightUniform[] = [];
			for (const [light] of lights) {
				light.render(width, height, drawables, context);
				const uniform = light.getUniform();
				if (uniform) {
					uniforms.push(uniform);
				}
			}

			Material.globals.set('LightCount', uniforms.length);
			Material.globals.set('Lights', uniforms);

			for (const [renderable] of this.renderables) {
				renderable.render(width, height, drawables, context);
			}
		}
	}
}
