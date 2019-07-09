import { Component, Entity } from '../Scene';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Quaterion } from '../math/Quaterion';
import { Mutable } from '../util/Mutable';
import { Euler } from '../math/Euler';

export class TransformComponent extends Component {
	public static executionOrder = -1000;

	public localQuaterion = new Quaterion();

	public readonly localMatrix: Matrix4;
	public readonly worldMatrix: Matrix4;
	public readonly parentTransform: TransformComponent | undefined;

	private lastParent: Entity | undefined;
	private lastLocalMatrix: Matrix4;
	private lastParentTransform: TransformComponent | undefined;
	private lastParentWorldMatrix: Matrix4 | undefined;

	constructor(
		public localPosition = new Vector3(),
		public localRotation = new Euler(),
		public localScale = new Vector3(1, 1, 1)
	) {
		super();
		this.localMatrix = new Matrix4();
		this.worldMatrix = new Matrix4();
		this.lastLocalMatrix = new Matrix4();
		this.update();
	}

	update() {
		this.localQuaterion.setFromEuler(this.localRotation);
		this.localMatrix.compose(
			this.localPosition,
			this.localQuaterion,
			this.localScale
		);

		if (this.entity && this.lastParent !== this.entity.parent) {
			this.lastParent = this.entity.parent;
			(this as Mutable<TransformComponent>).parentTransform =
				(this.entity.parent &&
					this.entity.parent.getComponent(TransformComponent)) ||
				undefined;
		}
		if (this.parentTransform) {
			if (
				this.lastParentTransform !== this.parentTransform ||
				!this.lastParentWorldMatrix ||
				!this.lastParentWorldMatrix.equals(this.parentTransform.worldMatrix) ||
				!this.lastLocalMatrix.equals(this.localMatrix)
			) {
				this.lastLocalMatrix.copy(this.localMatrix);
				this.worldMatrix.multiplyMatrices(
					this.parentTransform.worldMatrix,
					this.localMatrix
				);
				this.lastParentWorldMatrix = this.lastParentWorldMatrix
					? this.lastParentWorldMatrix.copy(this.parentTransform.worldMatrix)
					: this.parentTransform.worldMatrix.clone();
			}
		} else if (!this.lastLocalMatrix.equals(this.localMatrix)) {
			this.lastLocalMatrix.copy(this.localMatrix);
			this.worldMatrix.copy(this.localMatrix);
		}
	}

	getForwardVector(target: Vector3) {
		// return target.copy(Vector3.Forward).applyMatrix4(this.localMatrix);
		const e = this.worldMatrix.elements;
		return target.set(e[8], e[9], e[10]).normalize();
	}

	getRightVector(target: Vector3) {
		// return target.copy(Vector3.Right).applyMatrix4(this.localMatrix);
		const e = this.worldMatrix.elements;
		return target.set(e[0], e[4], e[8]).normalize();
	}

	getUpVector(target: Vector3) {
		// return target.copy(Vector3.Up).applyMatrix4(this.localMatrix);
		const e = this.worldMatrix.elements;
		return target.set(e[1], e[5], e[9]).normalize();
	}
}

export function EmptyPrefab({
	name = 'EmptyPrefab',
	position = Vector3.Zero,
	rotation = Euler.Zero,
	scale = Vector3.One,
	children = [],
}: {
	name?: string;
	position?: Vector3;
	rotation?: Euler;
	scale?: Vector3;
	children?: Entity[];
}) {
	return new Entity(name)
		.addComponent(
			new TransformComponent(position.clone(), rotation.clone(), scale.clone())
		)
		.addChild(...children);
}
