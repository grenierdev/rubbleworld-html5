import { Component, Scene, FixedUpdateContext, UpdateContext } from '../Scene';
import { Engine, IEngineDefinition, ICollisionFilter, IEventCollision, Body, World, Bodies, Runner } from 'matter-js';
import { Mutable } from '../util/Mutable';
import { EventEmitter } from 'events';
import { TransformComponent } from './Transform';
import { Vector2 } from '../math/Vector2';
import { ReadonlyBox2 } from '../math/Box2';
import { ReadonlyCircle } from '../math/Circle';
import { lerp, smootherstep } from '../math/util';

export class Physics2EngineComponent extends Component {
	public executionOrder = 900;

	public readonly engine: Engine;
	public readonly runner: Runner;

	constructor(createOptions: IEngineDefinition = { enableSleeping: true }) {
		super();

		this.runner = Runner.create({});
		this.engine = Engine.create(undefined, createOptions);
		this.engine.world.gravity.y = -1;
	}

	didMount() {
		if (!(this.entity instanceof Scene)) {
			this.setEnable(false);
			throw new ReferenceError(`Physics2EngineComponent can only be added to a Scene.`);
		}
	}

	update(context: UpdateContext) {
		if (context.debug) {
			const bodies = this.engine.world.bodies;
			for (const body of bodies) {
				const position = body.position;

				const wireframe: number[] = [];
				for (let i = 1, l = body.vertices.length; i < l; ++i) {
					wireframe.push(body.vertices[i - 1].x, body.vertices[i - 1].y, 0, body.vertices[i].x, body.vertices[i].y, 0);
				}
				wireframe.push(body.vertices[body.vertices.length - 1].x, body.vertices[body.vertices.length - 1].y, 0);
				wireframe.push(body.vertices[0].x, body.vertices[0].y, 0);
				context.debug.drawPrimitiveLines(wireframe, {
					ttl: 0,
					color: body.isSleeping ? [0.3, 0.3, 0.3, 0.5] : body.isStatic ? [0.6, 0.6, 0.6, 0.5] : [1.0, 1.0, 1.0, 0.5],
				});

				const axis: number[] = [
					position.x,
					position.y,
					0,
					(body.vertices[0].x + body.vertices[body.vertices.length - 1].x) / 2,
					(body.vertices[0].y + body.vertices[body.vertices.length - 1].y) / 2,
					0,
				];
				context.debug.drawPrimitiveLines(axis, {
					ttl: 0,
					color: [0.803921568627451, 0.3607843137254902, 0.3607843137254902, 0.5],
				});
			}

			// for (const pair of this.engine.pairs.list) {
			// 	if (!pair.isActive) {
			// 		continue;
			// 	}
			// 	console.log(pair);
			// }
		}
	}

	fixedUpdate(context: FixedUpdateContext) {
		this.engine.timing.timeScale = context.timeScale;
		Runner.tick(this.runner, this.engine, context.fixedTime);
		console.error('https://github.com/flyover/box2d.ts/tree/master/Box2D');
	}
}

export class Physics2BodyComponent extends Component {
	public executionOrder = 910;

	public readonly body: Body;

	public readonly transform: TransformComponent | undefined;
	public readonly engine: Physics2EngineComponent | undefined;
	public readonly collisionFilter: ICollisionFilter = {
		category: 1,
		group: 0,
		mask: -1,
	};
	public density = 0.001;
	public friction = 0.1;
	public frictionAir = 0.01;
	public frictionStatic = 0.5;
	public restitution = 0;
	public timeScale = 1;
	public sensor = false;
	public static = false;

	protected emitter = new EventEmitter();

	constructor(
		options?: Partial<
			Pick<
				Physics2BodyComponent,
				'density' | 'friction' | 'frictionAir' | 'frictionStatic' | 'restitution' | 'timeScale' | 'sensor' | 'static'
			>
		>
	) {
		super();

		if (options) {
			for (const key in options) {
				this[key] = options[key];
			}
		}

		this.body = Body.create({});
	}

	didMount() {
		(this as Mutable<Physics2BodyComponent>).transform = this.getComponent(TransformComponent);
		if (this.transform) {
			this.transform.breakParentChain = true;
		}
		(this as Mutable<Physics2BodyComponent>).engine = this.entity!.scene!.getComponent(Physics2EngineComponent);
		if (this.engine && this.body) {
			World.add(this.engine.engine.world, this.body);
		}

		this.updateBody();
	}

	willUnmount() {
		if (this.engine && this.body) {
			World.remove(this.engine.engine.world, this.body);
		}
	}

	updateBody() {
		Body.setStatic(this.body, this.static);
		Body.setDensity(this.body, this.density);
		this.body.friction = this.friction;
		this.body.frictionAir = this.frictionAir;
		this.body.frictionStatic = this.frictionStatic;
		this.body.restitution = this.restitution;
		this.body.timeScale = this.timeScale;
		this.body.isSensor = this.sensor;

		const colliders = this.getComponents(Physics2ColliderComponent, true);
		const parts = colliders.map(collider => collider.body);
		Body.setParts(this.body, parts);

		if (this.transform) {
			Body.setPosition(this.body, this.transform.localPosition);
			Body.setAngle(this.body, this.transform.localRotation.z);
		}

		Body.setAngularVelocity(this.body, 0);
		Body.setVelocity(this.body, Vector2.Zero);
	}

	update(context: FixedUpdateContext) {
		if (this.body && this.transform) {
			const alpha = smootherstep(
				context.fixedDeltaTime > 0 ? (context.time - context.fixedTime) / context.fixedDeltaTime : 1,
				0,
				1
			);
			this.transform.localPosition.set(
				lerp(this.transform.localPosition.x, this.body.position.x, alpha),
				lerp(this.transform.localPosition.y, this.body.position.y, alpha),
				0
			);
			this.transform.localRotation.set(0, 0, lerp(this.transform.localRotation.z, this.body.angle, alpha));
		}
	}

	onSleepStart(handler: () => void) {
		return this.emitter.on('onSleepStart', handler);
	}

	onSleepEnd(handler: () => void) {
		return this.emitter.on('onSleepEnd', handler);
	}

	onCollisionStart(handler: (collision: IEventCollision<Engine>) => void) {
		return this.emitter.on('onCollisionStart', handler);
	}

	onCollisionEnd(handler: (collision: IEventCollision<Engine>) => void) {
		return this.emitter.on('onCollisionStart', handler);
	}
}

export abstract class Physics2ColliderComponent extends Component {
	abstract readonly body: Body;
}

export class Physics2BoxColliderComponent extends Physics2ColliderComponent {
	public readonly body: Body;

	constructor(public readonly box: ReadonlyBox2) {
		super();

		const center = new Vector2();
		const size = new Vector2();
		box.getCenter(center);
		box.getSize(size);
		this.body = Bodies.rectangle(center.x, center.y, size.x, size.y);
	}
}

export class Physics2CircleColliderComponent extends Physics2ColliderComponent {
	public readonly body: Body;

	constructor(public circle: ReadonlyCircle) {
		super();

		this.body = Bodies.circle(circle.center.x, circle.center.y, circle.radius);
	}
}

export class Physics2CapsuleColliderComponent extends Physics2ColliderComponent {
	public readonly body: Body;

	constructor(public readonly capsule: ReadonlyBox2, public readonly radius = 0) {
		super();

		const center = new Vector2();
		const size = new Vector2();
		capsule.getCenter(center);
		capsule.getSize(size);
		this.body = Bodies.rectangle(center.x, center.y, size.x, size.y, { chamfer: { radius } });
	}
}
