import { Component, Entity } from '../Scene';
import {
	Camera,
	CameraPerspective,
	CameraOrthographic,
} from '../rendering/Camera';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Mutable';
import { Vector3 } from '../math/Vector3';
import { Euler } from '../math/Euler';

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

export function CameraPerspectivePrefab({
	name = 'CameraPerspectivePrefab',
	position = Vector3.Zero,
	rotation = Euler.Zero,
	scale = Vector3.One,
	camera,
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	camera: CameraPerspectiveConstructor;
}) {
	return new Entity(name)
		.addComponent(
			new TransformComponent(position.clone(), rotation.clone(), scale.clone())
		)
		.addComponent(new CameraPerspectiveComponent(camera));
}

export function CameraOrthographicPrefab({
	name = 'CameraOrthographicPrefab',
	position = Vector3.Zero,
	rotation = Euler.Zero,
	scale = Vector3.One,
	camera,
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	camera: CameraOrthographicConstructor;
}) {
	return new Entity(name)
		.addComponent(
			new TransformComponent(position.clone(), rotation.clone(), scale.clone())
		)
		.addComponent(new CameraOrthographicComponent(camera));
}
