import { Component } from '../Scene';
import {
	Camera,
	CameraPerspective,
	CameraOrthographic,
} from '../rendering/Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';

export abstract class CameraComponent extends Component {
	public readonly transform: TransformComponent | undefined;

	constructor(public readonly camera: Camera) {
		super();
	}

	willMount() {
		(this as Mutable<CameraComponent>).transform = this.getComponent(
			TransformComponent
		);
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
	constructor({ fov, aspect, far, near, zoom }: CameraPerspectiveConstructor) {
		super(new CameraPerspective(fov, aspect, near, far, zoom));
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
	constructor({
		bottom,
		left,
		far,
		near,
		right,
		top,
		zoom,
	}: CameraOrthographicConstructor) {
		super(new CameraOrthographic(left, right, top, bottom, near, far, zoom));
	}
}
