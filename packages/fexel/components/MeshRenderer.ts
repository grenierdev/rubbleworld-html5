import { Component } from '../Scene';
import { Mesh } from '../rendering/Mesh';
import { Material } from '../rendering/Material';
import { CameraComponent } from './Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';
import { Matrix4 } from '../math/Matrix4';

export class MeshRendererComponent extends Component {
	public readonly transform: TransformComponent | undefined;

	constructor(public mesh: Mesh, public material: Material) {
		super();
	}

	willMount() {
		// debugger;
		(this as Mutable<MeshRendererComponent>).transform = this.getComponent(
			TransformComponent
		);
	}

	render(viewpoint: CameraComponent) {
		this.material.setUniform(
			'worldMatrix',
			this.transform
				? this.transform.worldMatrix.elements
				: Matrix4.Identity.elements
		);
		this.material.setUniform(
			'viewMatrix',
			viewpoint.transform
				? viewpoint.transform.worldMatrix.elements
				: Matrix4.Identity.elements
		);
		this.material.setUniform(
			'projectionMatrix',
			viewpoint.camera.projectionMatrix.elements
		);
	}
}
