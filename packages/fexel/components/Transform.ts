import { Component, Entity } from '../Scene';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Quaterion } from '../math/Quaterion';
import { Mutable } from '../util/Mutable';

export class TransformComponent extends Component {
	public readonly localMatrix: Matrix4;
	public readonly worldMatrix: Matrix4;
	public readonly parentTransform: TransformComponent | undefined;

	private lastParent: Entity | undefined;
	private lastLocalMatrix: Matrix4;
	private lastParentTransform: TransformComponent | undefined;
	private lastParentWorldMatrix: Matrix4 | undefined;

	constructor(
		public localPosition = new Vector3(),
		public localScale = new Vector3(1, 1, 1),
		public localRotation = new Quaterion()
	) {
		super();
		this.localMatrix = new Matrix4().compose(
			this.localPosition,
			this.localRotation,
			this.localScale
		);
		this.worldMatrix = this.localMatrix.clone();

		this.lastLocalMatrix = this.localMatrix.clone();
	}

	onUpdate() {
		this.localMatrix.compose(
			this.localPosition,
			this.localRotation,
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
				this.worldMatrix.multiplyMatrices(
					this.parentTransform.worldMatrix,
					this.localMatrix
				);
				this.lastParentWorldMatrix = this.lastParentWorldMatrix
					? this.lastParentWorldMatrix.copy(this.parentTransform.worldMatrix)
					: this.parentTransform.worldMatrix.clone();
			}
		} else if (!this.lastLocalMatrix.equals(this.localMatrix)) {
			this.worldMatrix.copy(this.localMatrix);
		}

		this.lastLocalMatrix.copy(this.localMatrix);
	}

	getForwardVector(target: Vector3) {
		return target.copy(Vector3.Forward).applyMatrix4(this.worldMatrix);
	}

	getRightVector(target: Vector3) {
		return target.copy(Vector3.Right).applyMatrix4(this.worldMatrix);
	}

	getUpVector(target: Vector3) {
		return target.copy(Vector3.Up).applyMatrix4(this.worldMatrix);
	}
}

export function EmptyPrefab(
	position = Vector3.Zero,
	rotation = Quaterion.Identity,
	scale = Vector3.One
) {
	return new Entity('EmptyPrefab', [
		new TransformComponent(position.clone(), scale.clone(), rotation.clone()),
	]);
}
