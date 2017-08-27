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

export type ClientConnectEventListener = (client: Client, actor: Actor) => void;
export type ClientDisconnectEventListener = (client: Client, actor: Actor) => void;
export type EntitySpawnedEventListener<A extends Actor> = (entity: Entity) => void;
export type EntityRemovedEventListener<A extends Actor> = (entity: Entity) => void;
export type SceneChangedEventListener = () => void;

export class Scene<A extends Actor> extends EventEmitter {

	protected nextId: number;
	protected janitor: CompositeDisposable;

	protected entities: Map<string, Entity>;
	protected entityTypes: Map<string, new (...args) => Entity>;

	protected actorType: new (...args) => Actor;
	protected actors: Map<Client, A>;

	readonly client: Client | Server;

	constructor(client: Client | Server, actor: typeof Actor) {
		super();

		this.nextId = 0;
		this.janitor = new CompositeDisposable();

		this.entities = new Map<string, Entity>();
		this.entityTypes = new Map<string, typeof Entity>();

		this.actorType = actor;
		this.actors = new Map<Client, A>();

		this.client = client;


		if (this.client instanceof Server) {
			const server = this.client as Server;

			// New client receives the scene on connect
			this.janitor.add(server.onClientConnect((client) => {
				const defs: any[] = [];
				this.entities.forEach((entity) => {
					defs.push({ kind: entity.constructor.name, id: entity.id, state: entity.serialize() });
				});
				client.sendPayload({ type: 'SCNSTE', entities: defs });
				
				const type = this.actorType;
				const actor = new type(this, client) as A;
				this.actors.set(client, actor);
				this.emit('onClientConnect', client, actor);
			}));

			// 
			this.janitor.add(server.onClientDisconnect((client) => {
				if (this.actors.has(client)) {
					const actor = this.actors.get(client)!;
					this.emit('onClientDisconnect', client, actor);
					this.actors.delete(client);
				}
			}))

			// Transmit the RPC call to the entity only if the client can control the entity
			this.janitor.add(server.onMessage((client, message) => {
				if (message.type === 'SCNRPC') {
					const actor = this.actors.get(client);
					if (actor) {
						const entity = this.getEntityById(message.entity);
						if (entity && typeof entity[message.method] === 'function' && actor.canControl(entity.id)) {
							entity[message.method].call(entity, ...message.args);
						}
					}
				}
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

			this.janitor.add(client.onConnect(() => {
				const type = this.actorType;
				const actor = new type(this, client) as A;
				this.actors.set(client, actor);
			}));

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

	disposeAsync(): Promise<void> {
		return this.janitor.disposeAsync().then(super.disposeAsync);
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

	removeEntity(entity: Entity): void {
		if (this.entities.has(entity.id) === true) {
			this.entities.delete(entity.id);
			this.emit('onEntityRemoved', entity);
			this.emit('onSceneChanged');
		}
	}

	getEntityById<E extends Entity>(id: string): E | undefined {
		return this.entities.get(id) as E;
	}

	getEntityByType<E extends Entity>(kind: string): E[] {
		return Array.from<Entity>(this.entities.values()).filter((entity) => entity.constructor.name === kind) as E[];
	}

	getActors(): A[] {
		return Array.from(this.actors.values());
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

	onEntitySpawned(listener: EntitySpawnedEventListener<A>): Disposable {
		return this.on('onEntitySpawned', listener);
	}

	onEntityRemoved(listener: EntityRemovedEventListener<A>): Disposable {
		return this.on('onEntityRemoved', listener);
	}

	onSceneChanged(listener: SceneChangedEventListener): Disposable {
		return this.on('onSceneChanged', listener);
	}

}

export class Entity implements IDisposable {
	static replications: [string, Type][];

	readonly id: string;
	readonly scene: Scene<Actor>;
	protected janitor: CompositeDisposable;

	constructor(id: string) {
		this.id = id;
		this.janitor = new CompositeDisposable();
	}

	dispose(): void {
		return this.janitor.dispose();
	}

	isDisposed(): boolean {
		return this.janitor.isDisposed();
	}

	serialize(): any[] {
		const changes: any[] = [];
		const replications = (this.constructor as typeof Entity).replications || [];

		replications.forEach(([key, type]) => {
			changes.push(this[key]);
		});
		
		return changes;
	}

	onTick(): EntityChanges {
		return undefined;
	}
}

export class Actor implements IDisposable {

	readonly scene: Scene<Actor>;
	readonly client: Client;

	protected inControlOf: string[];
	protected janitor: CompositeDisposable;

	constructor(scene: Scene<Actor>, client: Client) {
		this.scene = scene;
		this.client = client;
		this.inControlOf = [];
		this.janitor = new CompositeDisposable();

		if (this.scene.isServer === false) {
			this.janitor.add(client.onMessage((message) => {
				if (message.type === 'ACTGRT') {
					this.inControlOf.push(message.id);
					this.scene.emit('onSceneChanged');
				}
				else if (message.type === 'ACTGRT') {
					this.inControlOf.splice(this.inControlOf.indexOf(message.id), 1);
					this.scene.emit('onSceneChanged');
				}
			}));
		}
	}

	dispose(): void {
		return this.janitor.dispose();
	}

	isDisposed(): boolean {
		return this.janitor.isDisposed();
	}

	grantControl(entityId: string): void {
		if (this.scene.isServer === false) {
			throw new SyntaxError(`Only the server can grant control over an Entity.`);
		}

		this.inControlOf.push(entityId);
		this.client.sendPayload({ type: 'ACTGRT', id: entityId });
		this.scene.emit('onSceneChanged');
	}

	revokeControl(entityId: string): void {
		if (this.scene.isServer) {
			throw new SyntaxError(`Only the server can revoke control over an Entity.`);
		}
		this.inControlOf = this.inControlOf.splice(this.inControlOf.indexOf(entityId), 1);
		this.client.sendPayload({ type: 'ACTREV', id: entityId });
		this.scene.emit('onSceneChanged');
	}

	canControl(entityId: string): boolean {
		return this.inControlOf.indexOf(entityId) > -1;
	}

	getInControl(): string[] {
		return Array.from(this.inControlOf);
	}

	canSee(entityId: string): boolean {
		return false;
	}
}

export function Replicated(type: Type) {
	return function (target: any, key: string) {
		if ((target instanceof Entity) === false) {
			throw new SyntaxError(`Decorator @Replicated can only be used on Entity.`);
		}

		const entityConstructor = target.constructor as typeof Entity;
		entityConstructor.replications = entityConstructor.replications || [];
		entityConstructor.replications.push([key, type]);
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
				const scene = this.scene;

				(scene.actors as Map<Client, Actor>).forEach((actor, client) => {
					if (actor.canSee(this)) {
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