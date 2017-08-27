import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

import { Payload } from './Message';
import { Client } from './Client';
import { Server } from './Server';

const RPCfromServer = Symbol('RPC');

export enum Type {
	Int8,
	Int16,
	Int32,
	UInt8,
	UInt16,
	UInt32,
	Float,
	Double,
	Boolean,
	String
}

export type EntityChanges = Map<string, any> | undefined | true;

export type ClientConnectEventListener = (client: SceneClient) => void;
export type ClientDisconnectEventListener = (client: SceneClient) => void;
export type EntitySpawnedEventListener = (entity: Entity) => void;
export type EntityRemovedEventListener = (entity: Entity) => void;
export type ActorSpawnedEventListener = (actor: Actor) => void;
export type ActorRemovedEventListener = (actor: Actor) => void;
export type SceneChangedEventListener = () => void;

export interface SceneClient extends Client {
	actor: Actor;
}

export class Scene extends EventEmitter {

	protected nextId: number;
	protected janitor: CompositeDisposable;

	protected entities: Map<string, Entity>;
	protected entityTypes: Map<string, new (...args) => Entity>;

	protected actors: Map<string, Actor>;
	protected actorTypes: Map<string, new (...args) => Actor>;

	readonly client: Client | Server;

	constructor(client: Client | Server) {
		super();

		this.nextId = 0;
		this.janitor = new CompositeDisposable();

		this.entities = new Map<string, Entity>();
		this.entityTypes = new Map<string, typeof Entity>();

		this.actors = new Map<string, Actor>();
		this.actorTypes = new Map<string, typeof Actor>();

		this.client = client;


		if (this.client instanceof Server) {
			const server = this.client as Server;

			// New client receives the scene on connect
			this.janitor.add(server.onClientConnect((client: SceneClient) => {
				const defs: any[] = [];
				this.entities.forEach((entity) => {
					defs.push({ kind: entity.constructor.name, id: entity.id, state: entity.serialize() });
				});
				client.sendPayload({ type: 'SCNSTE', entities: defs });
				this.emit('onClientConnect', client);
			}));

			// 
			this.janitor.add(server.onClientDisconnect((client: SceneClient) => {
				this.emit('onClientDisconnect', client);
			}))

			// Transmit the RPC call to the entity only if the client can control the entity
			this.janitor.add(server.onMessage((from: SceneClient, message) => {
				if (message.type === 'SCNRPC') {
					const entity = this.getEntityById(message.entity);
					if (entity && typeof entity[message.method] === 'function' && from.actor.canControl(entity)) {
						entity[message.method].call(entity, ...message.args);
					}
				}
			}));

			// Spawn actor only on his client
			this.janitor.add(this.onActorSpawned((actor) => {
				actor.client.sendPayload({ type: 'SCNACT', kind: actor.constructor.name, id: actor.id, state: actor.serialize() });
			}));

			// Spawn entity on clients when spawned on server
			this.janitor.add(this.onEntitySpawned((entity) => {
				server.broadcastAllPayload({ type: 'SCNSPW', kind: entity.constructor.name, id: entity.id, state: entity.serialize() });
			}));

			// Remove entity on clients when removed on server
			this.janitor.add(this.onEntityRemoved((entity) => {
				server.broadcastAllPayload({ type: 'SCNREM', id: entity.id });
			}));
		}
		else {
			const client = this.client as Client;

			this.janitor.add(client.onMessage((message) => {

				// Initial scene
				if (message.type === 'SCNSTE') {
					message.entities.forEach(def => {
						const entity = this.createEntity(def.kind, def.id, ...def.state);
						this.addEntityToScene(entity);
					});
				}

				// Transmit RPC from server directly to entity
				else if (message.type === 'SCNRPC') {
					const entity = this.getEntityById(message.entity);
					if (entity && typeof entity[message.method] === 'function') {
						entity[message.method].call(entity, ...[RPCfromServer].concat(message.args));
					}
				}

				// Spawn actor in scene
				else if (message.type === 'SCNACT') {
					const actor = this.createActor(message.kind, message.id, ...message.state);
					this.addActorToScene(actor);
				}

				// Spawn entity in scene
				else if (message.type === 'SCNSPW') {
					const entity = this.createEntity(message.kind, message.id, ...message.state);
					this.addEntityToScene(entity);
				}

				// Remove entity in scene
				else if (message.type === 'SCNREM') {
					const entity = this.getEntityById(message.id);
					if (entity) {
						this.removeEntity(entity);
					}
				}
			}));
		}
	}

	get isServer(): boolean {
		return this.client instanceof Server;
	}

	// Register new Entity class to be replicated on clients
	registerEntity(...entities: (new (...args) => Entity)[]): void {
		const types = this.entityTypes;
		const newTypes: (new (...args) => Entity)[] = [];
		entities.forEach(entity => {
			const kind = (entity as typeof Entity).name;
			if (types.has(kind) === false) {
				types.set(kind, entity);
				newTypes.push(entity);
			}
		});
		if (newTypes.length) {
			this.emit('onNewEntityRegistered', newTypes);
		}
	}

	// Register new Actor class (not replicated)
	registerActor(...actors: (new (...args) => Actor)[]): void {
		const types = this.actorTypes;
		const newTypes: (new (...args) => Actor)[] = [];
		actors.forEach(actor => {
			const kind = (actor as typeof Actor).name;
			if (types.has(kind) === false) {
				types.set(kind, actor);
				newTypes.push(actor);
			}
		});
		if (newTypes.length) {
			this.emit('onNewActorRegistered', newTypes);
		}
	}

	protected createEntity<E extends Entity>(kind: string, id: string, ...args: any[]): E {
		const type = this.entityTypes.get(kind)!;
		const entity = new type(...[id].concat(args)) as E;
		(entity as any).scene = this; // bypass readonly

		return entity;
	}

	protected addEntityToScene(entity: Entity): void {
		this.entities.set(entity.id, entity);
		this.emit('onEntitySpawned', entity);
		this.emit('onSceneChanged');
	}

	// Spawn an Entity in the scene
	spawnEntity<E extends Entity>(kind: string, ...args: any[]): E {
		if (this.entityTypes.has(kind) === false) {
			throw new ReferenceError(`Entity ${kind} is not registered.`);
		}

		const id = (++this.nextId).toString();
		const entity = this.createEntity<E>(kind, id, ...args);

		this.addEntityToScene(entity);

		return entity;
	}

	protected createActor<A extends Actor>(kind: string, id: string, ...args: any[]): A {
		const type = this.actorTypes.get(kind)!;
		console.log('Creating actor', id, args);
		const actor = new type(...[id].concat(args)) as A;
		(actor as any).scene = this; // bypass readonly

		return actor;
	}

	protected addActorToScene(actor: Actor): void {
		this.actors.set(actor.id, actor);
		this.emit('onActorSpawned', actor);
	}

	// Spawn an Actor in the scene
	spawnActor<A extends Actor>(kind: string, client: Client, ...args: any[]): A {
		if (this.actorTypes.has(kind) === false) {
			throw new ReferenceError(`Actor ${kind} is not registered.`);
		}

		const id = (++this.nextId).toString();
		const actor = this.createActor<A>(kind, id, ...args);
		(actor as any).client = client as SceneClient; // bypass readonly
		(client as SceneClient).actor = actor;

		this.addActorToScene(actor);

		return actor;
	}

	removeEntity(entity: Entity): void {
		if (this.entities.has(entity.id) === true) {
			this.entities.delete(entity.id);
			this.emit('onEntityRemoved', entity);
			this.emit('onSceneChanged');
		}
	}

	removeActor(actor: Actor): void {
		if (this.actors.has(actor.id) === true) {
			this.actors.delete(actor.id);
			this.emit('onActorRemoved', actor);
		}
	}

	getEntityById<E extends Entity>(id: string): E | undefined {
		return this.entities.get(id) as E;
	}

	getEntityByType<E extends Entity>(kind: string): E[] {
		return Array.from<Entity>(this.entities.values()).filter((entity) => entity.constructor.name === kind) as E[];
	}

	getActorById<A extends Actor>(id: string): A | undefined {
		return this.actors.get(id) as A;
	}

	getActorByType<A extends Actor>(kind: string): A[] {
		return Array.from<Actor>(this.actors.values()).filter((actor) => actor.constructor.name === kind) as A[];
	}

	tick(): void {
		const entitiesChanged: [Entity, EntityChanges][] = [];
		this.entities.forEach((entity: Entity, id: string) => {
			const changes = entity.onTick();
		});

		if (entitiesChanged.length) {
			this.emit('onSceneChanged');
		}
	}

	onClientConnect(listener: ClientConnectEventListener): Disposable {
		return this.on('onClientConnect', listener);
	}

	onClientDisconnect(listener: ClientDisconnectEventListener): Disposable {
		return this.on('onClientDisconnect', listener);
	}

	onEntitySpawned(listener: EntitySpawnedEventListener): Disposable {
		return this.on('onEntitySpawned', listener);
	}

	onEntityRemoved(listener: EntityRemovedEventListener): Disposable {
		return this.on('onEntityRemoved', listener);
	}

	onActorSpawned(listener: ActorSpawnedEventListener): Disposable {
		return this.on('onActorSpawned', listener);
	}

	onActorRemoved(listener: ActorRemovedEventListener): Disposable {
		return this.on('onActorRemoved', listener);
	}

	onSceneChanged(listener: SceneChangedEventListener): Disposable {
		return this.on('onSceneChanged', listener);
	}

}

export class Entity {
	static replications: [string, Type][] = [];

	readonly id: string;
	readonly scene: Scene;

	constructor(id: string) {
		this.id = id;
	}

	serialize(): any[] {
		const changes: any[] = [];
		const replications = (this.constructor as typeof Entity).replications;

		replications.forEach(([key, type]) => {
			changes.push(this[key]);
		});

		return changes;
	}

	onTick(): EntityChanges {
		return undefined;
	}
}

export class Actor extends Entity {

	readonly client: SceneClient;

	@Replicated(Type.String)
	inControlOf: string[];

	constructor(id: string, controls: string[]) {
		super(id);
		this.inControlOf = controls;
	}

	@RPC()
	grantControl(entityId: string): void {
		this.inControlOf.push(entityId);
	}

	@RPC()
	revokeControl(entityId: string): void {
		this.inControlOf = this.inControlOf.splice(this.inControlOf.indexOf(entityId), 1);
	}

	canControl(entity: Entity): boolean {
		return this.inControlOf.indexOf(entity.id) > -1;
	}

	getInControl(): Entity[] {
		return Array.from(this.inControlOf.values()).map<Entity>((id: string) => this.scene.getEntityById(id)!);
	}

	canSee(entity: Entity): boolean {
		return false;
	}
}

export function Replicated(type: Type) {
	return function (target: any, key: string) {
		if ((target instanceof Entity) === false) {
			throw new SyntaxError(`Decorator @Replicated can only be used on Entity.`);
		}

		(target.constructor as typeof Entity).replications.push([key, type]);
	}
}

export function RPC() {
	return function (target: any, key: string, descriptor: PropertyDescriptor) {
		const originalMethod: (...args: any[]) => any = descriptor.value;
		descriptor.value = function (...args: any[]): any {
			if ((this instanceof Entity) === false) {
				throw new SyntaxError(`Decorator @RPC can only be used on Entity.`);
			}

			if (this.scene.isServer) {
				originalMethod.call(this, ...args);
				const server = this.scene.client as Server;
				server.getClients().forEach((client: SceneClient) => {
					if (client.actor && client.actor.canSee(this)) {
						client.sendPayload({ type: 'SCNRPC', entity: this.id, method: key, args });
					}
				});
			}
			else if (args.length > 1 && args[0] === RPCfromServer) {
				originalMethod.call(this, ...args.slice(1));
			}
			else {
				const client = this.scene.client as Client;
				client.sendPayload({ type: 'SCNRPC', entity: this.id, method: key, args });
			}
		}
	}
}