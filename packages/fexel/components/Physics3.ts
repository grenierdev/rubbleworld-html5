import { World, Shape, Box, Vec3 as CVector3, Quaternion as CQuaternion, Sphere, Body, Material, Plane } from 'cannon';
import { Component, UpdateContext, FixedUpdateContext, Scene } from '../Scene';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { EventEmitter } from '@konstellio/eventemitter';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Immutable';
import { smootherstep, lerp } from '../math/util';
import { Euler, ReadonlyEuler } from '../math/Euler';
import { Quaternion } from '../math/Quaternion';
import { Color } from '../math/Color';
import { Matrix4 } from '../math/Matrix4';
import { Box3 } from '../math/Box3';

const COLOR_SLEEPING = new Color(0.2431372549019608, 0.7176470588235294, 0.9372549019607843, 1.0);
const COLOR_STATIC = new Color(0.6, 0.6, 0.6, 1.0);
const COLOR_DYNAMIC = new Color(0.4235294117647059, 1.0, 0.3568627450980392, 1.0);

export class Physics3EngineComponent extends Component {
	public executionOrder = 900;

	public readonly world: World;

	constructor(public gravity = new Vector3(0, -10, 0), public timeStep = 1 / 60, public maxSubSteps = 3) {
		super();

		this.world = new World();
	}

	didMount() {
		if (!(this.entity instanceof Scene)) {
			this.setEnable(false);
			throw new ReferenceError(`Physics3EngineComponent can only be added to a Scene.`);
		}
	}

	update(context: UpdateContext) {
		if (context.debug) {
			for (const body of this.world.bodies) {
				const type = body.type;
				const position = body.position;
				const quaternion = body.quaternion;
				const color = type === Body.STATIC ? COLOR_STATIC : COLOR_DYNAMIC;
				const matrix = m0.compose(
					v0.set(position.x, position.z, position.y),
					q0.set(quaternion.x, quaternion.z, -quaternion.y, quaternion.w),
					Vector3.One
				);

				for (let l = body.shapes.length, i = 0; i < l; ++i) {
					const shape = body.shapes[i];

					if (shape instanceof Sphere) {
						context.debug.drawSphere(Vector3.Zero, shape.radius, 0, color, matrix);
						// console.log('Sphere', position.x, position.y, position.z);
					} else if (shape instanceof Box) {
						context.debug.drawPoint(Vector3.Zero, 2, 0, color, matrix);
						context.debug.drawBox3(
							b0.setFromCenterAndSize(
								Vector3.Zero,
								v0.set(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2)
							),
							0,
							color,
							matrix
						);
					} else if (shape instanceof Plane) {
					}
				}
			}
		}
	}

	fixedUpdate(context: FixedUpdateContext) {
		const dt = Math.min(1000 / 60, context.fixedDeltaTime);
		this.world.gravity.x = this.gravity.x;
		this.world.gravity.y = this.gravity.z;
		this.world.gravity.z = this.gravity.y;
		this.world.step(this.timeStep, dt / 1000, this.maxSubSteps);
	}
}

export enum Physics3BodyType {
	Dynamic,
	Static,
	Kinematic,
}

export interface Physics3Filter {
	mask: number;
	group: number;
}

export class Physics3Material {
	constructor(public friction = 1, public restitution = 0) {}
}

export class Physics3BodyComponent extends Component {
	public executionOrder = 910;

	public readonly body: Body | undefined;

	public readonly transform: TransformComponent | undefined;
	public readonly engine: Physics3EngineComponent | undefined;

	protected emitter = new EventEmitter();

	constructor(
		public type = Physics3BodyType.Static,
		public mass = 1,
		public material = new Physics3Material(),
		public filter: Physics3Filter = {
			mask: 1,
			group: 1,
		}
	) {
		super();
	}

	didMount() {
		(this as Mutable<Physics3BodyComponent>).transform = this.getComponent(TransformComponent);
		if (this.transform) {
			this.transform.breakParentChain = true;
		}
		(this as Mutable<Physics3BodyComponent>).engine = this.entity!.scene!.getComponent(Physics3EngineComponent);
		if (this.engine) {
			this.updateBody();
		}
	}

	willUnmount() {
		if (this.engine && this.body) {
			this.engine.world.remove(this.body);
		}
	}

	updateBody() {
		if (this.engine) {
			if (!this.body) {
				(this as Mutable<Physics3BodyComponent>).body = new Body({
					material: new Material('base'),
				});
				this.engine!.world.addBody(this.body!);
			}

			this.body!.mass = this.mass;
			this.body!.updateMassProperties();
			this.body!.material.friction = this.material.friction;
			this.body!.material.restitution = this.material.restitution;

			switch (this.type) {
				case Physics3BodyType.Dynamic:
					this.body!.type = Body.DYNAMIC;
					break;
				case Physics3BodyType.Static:
					this.body!.type = Body.STATIC;
					break;
				case Physics3BodyType.Kinematic:
					this.body!.type = Body.KINEMATIC;
					break;
			}

			if (this.transform) {
				const lp = this.transform.localPosition;
				const lq = this.transform.localQuaternion;
				this.body!.position.x = lp.x;
				this.body!.position.y = lp.z;
				this.body!.position.z = lp.y;
				this.body!.quaternion.x = lq.x;
				this.body!.quaternion.y = lq.z;
				this.body!.quaternion.z = -lq.y;
				this.body!.quaternion.w = lq.w;
			}

			this.body!.shapes = [];
			this.body!.shapeOffsets = [];
			this.body!.shapeOrientations = [];

			const colliders = this.getComponents(Physics3ColliderComponent, true);
			for (const collider of colliders) {
				q0.setFromEuler(collider.rotation);
				this.body!.addShape(
					collider.shape,
					new CVector3(collider.offset.x, collider.offset.z, collider.offset.y),
					new CQuaternion(q0.x, q0.z, -q0.y, q0.w)
				);
			}
		}
	}

	update(context: FixedUpdateContext) {
		if (this.body && this.transform) {
			const alpha =
				context.time - context.fixedTime >= context.fixedDeltaTime
					? smootherstep(
							context.fixedDeltaTime > 0 ? (context.time - context.fixedTime) / context.fixedDeltaTime : 1,
							0,
							1
					  )
					: 1;
			const position = this.body.position;
			const quaternion = this.body.quaternion;
			e0.setFromQuaternion(q0.set(quaternion.x, quaternion.z, -quaternion.y, quaternion.w));

			this.transform.localPosition.set(
				lerp(this.transform.localPosition.x, position.x, alpha),
				lerp(this.transform.localPosition.y, position.z, alpha),
				lerp(this.transform.localPosition.z, position.y, alpha)
			);
			this.transform.localRotation.set(
				lerp(this.transform.localRotation.x, e0.x, alpha),
				lerp(this.transform.localRotation.y, e0.y, alpha),
				lerp(this.transform.localRotation.z, e0.z, alpha)
			);
		}
	}

	onSleepStart(handler: () => void) {
		return this.emitter.on('onSleepStart', handler);
	}

	onSleepEnd(handler: () => void) {
		return this.emitter.on('onSleepEnd', handler);
	}

	onCollisionStart(handler: (collision: unknown) => void) {
		return this.emitter.on('onCollisionStart', handler);
	}

	onCollisionEnd(handler: (collision: unknown) => void) {
		return this.emitter.on('onCollisionStart', handler);
	}
}

export abstract class Physics3ColliderComponent extends Component {
	constructor(
		public shape: Shape,
		public readonly offset: Vector3 | ReadonlyVector3 = Vector3.Zero.clone(),
		public readonly rotation: Euler | ReadonlyEuler = Euler.Zero.clone()
	) {
		super();
	}
}

export class Physics3BoxColliderComponent extends Physics3ColliderComponent {
	constructor(public readonly size: Vector3, offset = Vector3.Zero.clone(), rotation = Euler.Zero.clone()) {
		super(new Box(new CVector3(size.x / 2, size.y / 2, size.z / 2)), offset, rotation);
	}
}

export class Physics3SphereColliderComponent extends Physics3ColliderComponent {
	constructor(public readonly radius: number, offset = Vector3.Zero.clone(), rotation = Euler.Zero.clone()) {
		super(new Sphere(radius), offset, rotation);
	}
}

export class Physics3PlaneColliderComponent extends Physics3ColliderComponent {
	constructor(rotation = Euler.Zero.clone()) {
		super(new Plane(), Vector3.Zero, rotation);
	}
}

const v0 = new Vector3();
const q0 = new Quaternion();
const m0 = new Matrix4();
const b0 = new Box3();
const e0 = new Euler();
