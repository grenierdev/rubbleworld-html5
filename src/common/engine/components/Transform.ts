import { Component, Entity } from "../Scene";
import { Vector3, Quaterion } from "../math";

export class Transform extends Component {

	private cachedParent: Entity | undefined;
	private cachedParentTransform: Transform | undefined;

	public localPosition: Vector3;
	public localScale: Vector3;
	public localRotation: Quaterion;

	constructor() {
		super();

		this.localPosition = new Vector3();
		this.localScale = new Vector3(1, 1, 1);
		this.localRotation = new Quaterion();
	}

	onStart() {

	}
}