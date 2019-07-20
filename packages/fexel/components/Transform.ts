import { Component, Entity } from '../Scene';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Quaterion, ReadonlyQuaterion } from '../math/Quaterion';
import { Mutable } from '../util/Mutable';
import { Euler } from '../math/Euler';

export class TransformComponent extends Component {
	public static executionOrder = -1000;

	public readonly localQuaterion: ReadonlyQuaterion = new Quaterion();
	public readonly localMatrix: ReadonlyMatrix4 = new Matrix4();
	public readonly worldMatrix: ReadonlyMatrix4 = new Matrix4();
	public readonly parentTransform: TransformComponent | undefined;

	private lastParent: Entity | undefined;
	private lastLocalMatrix: ReadonlyMatrix4 = new Matrix4();
	private lastParentTransform: TransformComponent | undefined;
	private lastParentWorldMatrix: ReadonlyMatrix4 | undefined;

	constructor(
		public localPosition = new Vector3(),
		public localRotation = new Euler(),
		public localScale = new Vector3(1, 1, 1)
	) {
		super();
		this.update();
	}

	update() {
		(this.localQuaterion as Quaterion).setFromEuler(this.localRotation);
		(this.localMatrix as Matrix4).compose(
			this.localPosition,
			this.localQuaterion,
			this.localScale
		);

		if (this.entity && this.lastParent !== this.entity.parent) {
			this.lastParent = this.entity.parent;
			(this as Mutable<TransformComponent>).parentTransform =
				(this.entity.parent && this.entity.parent.getComponent(TransformComponent)) || undefined;
		}
		if (this.parentTransform) {
			if (
				this.lastParentTransform !== this.parentTransform ||
				!this.lastParentWorldMatrix ||
				!this.lastParentWorldMatrix.equals(this.parentTransform.worldMatrix) ||
				!this.lastLocalMatrix.equals(this.localMatrix)
			) {
				(this.lastLocalMatrix as Matrix4).copy(this.localMatrix);
				(this.worldMatrix as Matrix4).multiplyMatrices(this.parentTransform.worldMatrix, this.localMatrix);
				this.lastParentWorldMatrix = this.lastParentWorldMatrix
					? (this.lastParentWorldMatrix as Matrix4).copy(this.parentTransform.worldMatrix)
					: this.parentTransform.worldMatrix.clone();
			}
		} else if (!this.lastLocalMatrix.equals(this.localMatrix)) {
			(this.lastLocalMatrix as Matrix4).copy(this.localMatrix);
			(this.worldMatrix as Matrix4).copy(this.localMatrix);
		}
	}

	getForwardVector(target: Vector3) {
		const e = this.worldMatrix.elements;
		return target.set(e[8], e[9], e[10]).normalize();
	}

	getRightVector(target: Vector3) {
		const e = this.worldMatrix.elements;
		return target.set(e[0], e[4], e[8]).normalize();
	}

	getUpVector(target: Vector3) {
		const e = this.worldMatrix.elements;
		return target.set(e[1], e[5], e[9]).normalize();
	}
}

export function EmptyPrefab({
	name = 'EmptyPrefab',
	position = Vector3.Zero.clone(),
	rotation = Euler.Zero.clone(),
	scale = Vector3.One.clone(),
	children = [],
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	children?: Entity[];
}) {
	return new Entity(name, new TransformComponent(position, rotation, scale)).addChild(...children);
}
