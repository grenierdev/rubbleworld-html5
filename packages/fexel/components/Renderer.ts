import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';

export interface IRenderable {
	render(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext): void;
}

export interface IDrawable {
	draw(
		gl: WebGLRenderingContext,
		viewMatrix: Matrix4 | ReadonlyMatrix4,
		projectionMatrix: Matrix4 | ReadonlyMatrix4,
		visibilityFlag: number
	): void;
}

export class RendererComponent extends Component {
	public executionOrder = 2000;

	public readonly drawables: PriorityList<IDrawable> = new PriorityList();
	public readonly renderables: PriorityList<IRenderable> = new PriorityList();

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
			for (const [renderable] of this.renderables) {
				renderable.render(width, height, drawables, context);
			}
		}
	}
}
