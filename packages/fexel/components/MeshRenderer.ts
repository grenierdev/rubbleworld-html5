import { Component, RenderContext } from '../Scene';
import { Mesh } from '../rendering/Mesh';
import { Material } from '../rendering/Material';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';
import { Matrix4 } from '../math/Matrix4';

export class MeshRendererComponent extends Component {
	public readonly transform: TransformComponent | undefined;

	constructor(public mesh: Mesh, public material: Material) {
		super();
	}

	didMount() {
		(this as Mutable<MeshRendererComponent>).transform = this.getComponent(TransformComponent);
	}

	update() {
		this.renderOrder = this.material.queue;
	}

	render({ gl, viewMatrix, projectionMatrix }: RenderContext) {
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
