import { Component, Entity } from '../Scene';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Quaterion } from '../math/Quaterion';

export class TransformComponent extends Component {
	public localMatrix: Matrix4;
	public worldMatrix: Matrix4;

	private cachedPosition: Vector3;
	private cachedRotation: Quaterion;
	private cachedScale: Vector3;
	private cachedParentMatrix: Matrix4 | undefined;

	constructor(
		public localPosition = new Vector3(),
		public localScale = new Vector3(1, 1, 1),
		public localRotation = new Quaterion()
	) {
		super();
		this.cachedPosition = new Vector3();
		this.cachedRotation = new Quaterion();
		this.cachedScale = new Vector3();
		this.cachedParentMatrix = new Matrix4();
		this.localMatrix = new Matrix4().compose(
			this.localPosition,
			this.localRotation,
			this.localScale
		);
		this.worldMatrix = new Matrix4().copy(this.localMatrix);
	}

	onUpdate() {
		let changed = false;

		// Get parent transform from parent entity if possible
		let parentTransform: TransformComponent | undefined;
		if (this.entity && this.entity.parent) {
			parentTransform = this.entity.parent.getComponent(TransformComponent);
		}

		// Did the transform changed ?
		if (
			this.cachedPosition.equals(this.localPosition) === false ||
			this.cachedRotation.equals(this.localRotation) === false ||
			this.cachedScale.equals(this.localScale) === false
		) {
			// Compose new matrix
			this.localMatrix.compose(
				this.localPosition,
				this.localRotation,
				this.localScale
			);
			this.cachedPosition.copy(this.localPosition);
			this.cachedRotation.copy(this.localRotation);
			this.cachedScale.copy(this.localScale);
			changed = true;
		}

		// Got a parent, maybe parent changed
		if (parentTransform) {
			// Did the parent transform changed ?
			if (
				this.cachedParentMatrix === undefined ||
				this.cachedParentMatrix.equals(parentTransform.worldMatrix) === false
			) {
				this.cachedParentMatrix = this.cachedParentMatrix
					? this.cachedParentMatrix.copy(parentTransform.worldMatrix)
					: parentTransform.worldMatrix.clone();
				changed = true;
			}

			// Either local or parent has changed
			if (changed) {
				// Compute world matrix
				this.worldMatrix.multiplyMatrices(
					this.cachedParentMatrix,
					this.localMatrix
				);
			}
		}

		// Had a parent, but no more
		else if (this.cachedParentMatrix) {
			this.cachedParentMatrix = undefined;
			// Set world matrix to local one
			this.worldMatrix.copy(this.localMatrix);
		}

		// No parent, but something changed
		else if (changed) {
			// Update world matrix to reflect local one
			this.worldMatrix.copy(this.localMatrix);
		}
	}

	getForwardVector(target: Vector3) {
		return target
			.copy(Vector3.Forward)
			.applyQuaternion(this.localRotation)
			.applyMatrix4(this.worldMatrix);
	}

	getRightVector(target: Vector3) {
		return target
			.copy(Vector3.Right)
			.applyQuaternion(this.localRotation)
			.applyMatrix4(this.worldMatrix);
	}

	getUpVector(target: Vector3) {
		return target
			.copy(Vector3.Up)
			.applyQuaternion(this.localRotation)
			.applyMatrix4(this.worldMatrix);
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
