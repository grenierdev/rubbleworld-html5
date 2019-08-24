import { Component, Entity } from '../Scene';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Quaternion, ReadonlyQuaternion } from '../math/Quaternion';
import { Mutable } from '../util/Immutable';
import { Euler, ReadonlyEuler } from '../math/Euler';

export class TransformComponent extends Component {
	public executionOrder = 1000;

	public breakParentChain = false;

	public readonly localQuaternion: ReadonlyQuaternion = new Quaternion();
	public readonly localMatrix: ReadonlyMatrix4 = new Matrix4();
	public readonly worldQuaternion: ReadonlyQuaternion = new Quaternion();
	public readonly worldPosition: ReadonlyVector3 = new Vector3();
	public readonly worldRotation: ReadonlyEuler = new Euler();
	public readonly worldScale: ReadonlyVector3 = new Vector3(1, 1, 1);
	public readonly worldMatrix: ReadonlyMatrix4 = new Matrix4();
	public readonly worldMatrixInverse: ReadonlyMatrix4 = new Matrix4();
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
		(this.localQuaternion as Quaternion).setFromEuler(this.localRotation);
		(this.localMatrix as Matrix4).compose(
			this.localPosition,
			this.localQuaternion,
			this.localScale
		);

		if (this.entity && this.lastParent !== this.entity.parent) {
			this.lastParent = this.entity.parent;
			(this as Mutable<TransformComponent>).parentTransform =
				(this.entity.parent && this.entity.parent.getComponent(TransformComponent)) || undefined;
		}
		if (!this.breakParentChain && this.parentTransform) {
			if (
				this.lastParentTransform !== this.parentTransform ||
				!this.lastParentWorldMatrix ||
				!this.lastParentWorldMatrix.equals(this.parentTransform.worldMatrix) ||
				!this.lastLocalMatrix.equals(this.localMatrix)
			) {
				(this.lastLocalMatrix as Matrix4).copy(this.localMatrix);
				(this.worldMatrix as Matrix4).multiplyMatrices(this.parentTransform.worldMatrix, this.localMatrix);
				(this.worldMatrixInverse as Matrix4).inverse(this.worldMatrix);
				this.worldMatrix.decompose(
					this.worldPosition as Vector3,
					this.worldQuaternion as Quaternion,
					this.worldScale as Vector3
				);
				(this.worldRotation as Euler).setFromQuaternion(this.worldQuaternion);
				this.lastParentWorldMatrix = this.lastParentWorldMatrix
					? (this.lastParentWorldMatrix as Matrix4).copy(this.parentTransform.worldMatrix)
					: this.parentTransform.worldMatrix.clone();
			}
		} else if (!this.lastLocalMatrix.equals(this.localMatrix)) {
			(this.lastLocalMatrix as Matrix4).copy(this.localMatrix);
			(this.worldMatrix as Matrix4).copy(this.localMatrix);
			(this.worldMatrixInverse as Matrix4).inverse(this.worldMatrix);
			this.worldMatrix.decompose(
				this.worldPosition as Vector3,
				this.worldQuaternion as Quaternion,
				this.worldScale as Vector3
			);
			(this.worldRotation as Euler).setFromQuaternion(this.worldQuaternion);
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
	return new Entity(name, [new TransformComponent(position, rotation, scale)], children);
}
