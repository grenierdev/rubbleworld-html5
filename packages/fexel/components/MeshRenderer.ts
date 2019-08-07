import { Component } from '../Scene';
import { IMesh } from '../rendering/Mesh';
import { Material } from '../rendering/Material';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Immutable';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { RendererComponent, IDrawable } from './Renderer';

export class MeshRendererComponent extends Component implements IDrawable {
	public readonly transform: TransformComponent | undefined;
	protected renderer: RendererComponent | undefined;

	constructor(public mesh: IMesh, public material: Material, public visibilityFlag: number = 0xff) {
		super();
	}

	didMount() {
		(this as Mutable<MeshRendererComponent>).transform = this.getComponent(TransformComponent);

		const scene = this.entity!.scene;
		this.renderer = scene ? scene.getComponent(RendererComponent) : undefined;
		if (this.renderer) {
			this.renderer.drawables.add(this, this.material.queue);
		}
	}

	willUnmount() {
		if (this.renderer) {
			this.renderer.drawables.remove(this);
		}
	}

	draw(
		gl: WebGLRenderingContext,
		viewMatrix: Matrix4 | ReadonlyMatrix4,
		projectionMatrix: Matrix4 | ReadonlyMatrix4,
		visibilityFlag: number
	) {
		if (this.enabled && this.entity && this.entity.enabled && visibilityFlag & this.visibilityFlag) {
			this.material.setUniform(
				'worldMatrix',
				this.transform ? this.transform.worldMatrix.elements : Matrix4.Identity.elements
			);
			this.material.setUniform('viewMatrix', viewMatrix.elements);
			this.material.setUniform('projectionMatrix', projectionMatrix.elements);

			this.material.bind(gl);
			this.mesh.draw(gl);
		}
	}
}
