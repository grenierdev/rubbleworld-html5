import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { CameraComponent } from './Camera';
import { MeshRendererComponent } from './MeshRenderer';

export class RendererComponent extends Component {
	public executionOrder = 2000;

	public readonly meshes: PriorityList<MeshRendererComponent> = new PriorityList();
	public readonly cameras: PriorityList<CameraComponent> = new PriorityList();

	didMount() {
		if (!(this.entity instanceof Scene)) {
			console.warn('RendererComponent only works on Scene.');
		}
	}

	update(context: UpdateContext) {
		if (context.canvas && context.gl && this.entity instanceof Scene) {
			const width = context.canvas.width;
			const height = context.canvas.height;
			const meshes = this.meshes;
			for (const [camera] of this.cameras) {
				camera.draw(width, height, meshes, context);
			}
		}
	}
}
