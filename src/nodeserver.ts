import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

interface Action {
	type: string;
	[payload: string]: any;
}

export enum Type {
	Int8,
	Int16,
	Int32,
	UInt8,
	UInt16,
	UInt32,
	Float,
	Double,
	String,
	Boolean
}

export function Replicated(type: Type) {
	return function (entity: Entity, key: string) {
		(entity.constructor as typeof Entity).replications.push([key, type]);
	}
}

export type EntityChanges = Map<string, any> | undefined | true;


let nextId = 0;
export function generateId(): string {
	return (++nextId).toString();
}

export class Scene extends EventEmitter {

	private entities: Map<string, Entity>;
	private types: Map<string, new(...args) => Entity>;

	constructor()
	constructor(entities: Map<string, Entity>, types: Map<string, new(...args) => Entity>)
	constructor(entities?: Map<string, Entity>, types?: Map<string, new(...args) => Entity>) {
		super();

		this.entities = entities || new Map<string, Entity>();
		this.types = types || new Map<string, typeof Entity>();
	}

	registerEntity(...entities: (new(...args) => Entity)[]): void {
		const types = this.types;
		const newTypes: (new (...args) => Entity)[] = [];
		entities.forEach(entity => {
			const handle = (entity as typeof Entity).name;
			if (types.has(handle) === false) {
				types.set(handle, entity);
				newTypes.push(entity);
			}
		});
		if (newTypes.length) {
			this.emit('onNewEntityRegistered', newTypes);
		}
	}

	spawnEntity<E extends Entity>(handle: string, ...args: any[]): E {
		if (this.types.has(handle) === false) {
			throw new ReferenceError(`Entity ${handle} is not registered.`);
		}
		const type = this.types.get(handle)!;
		const entity = new type(...args) as E;

		this.entities.set(entity.id, entity);
		this.emit('onEntitySpawned', entity);
		this.emit('onSceneChanged', [[entity, true]]);

		return entity;
	}

	removeEntity(entity: Entity): void {
		if (this.entities.has(entity.id) === true) {
			this.entities.delete(entity.id);
			this.emit('onEntityRemoved', entity);
			this.emit('onSceneChanged', [[entity, undefined]]);
		}
	}

	getEntityById<E extends Entity>(id: string): E {
		if (this.entities.has(id) === false) {
			throw new ReferenceError(`Entity ${id} is not present in this scene.`);
		}
		return this.entities.get(id) as E;
	}

	tick(): void {
		const entitiesChanged: [Entity, EntityChanges][] = [];
		this.entities.forEach((entity: Entity, id: string) => {
			const changes = entity.onTick();
			if (changes) {
				entitiesChanged.push([entity, changes]);
			}
		});

		if (entitiesChanged.length) {
			this.emit('onSceneChanged', entitiesChanged);
		}
	}

	dispatchAction(action: Action): void {
		const entitiesChanged: [Entity, EntityChanges][] = [];
		this.entities.forEach((entity: Entity, id: string) => {
			const changes = entity.onAction(action);
			if (changes) {
				entitiesChanged.push([entity, changes]);
			}
		});

		if (entitiesChanged.length) {
			this.emit('onSceneChanged', entitiesChanged);
		}
	}

}

export class Entity {
	static replications: [string, Type][] = [];

	readonly id: string;

	constructor()
	constructor(id: string | undefined)
	constructor(id?: string) {
		this.id = id || generateId();
	}

	getState(): EntityChanges {
		const changes = new Map<string, any>();
		const replications = (this.constructor as typeof Entity).replications;

		replications.forEach(([key, type]) => {
			changes.set(key, this[key]);
		});

		return changes;
	}

	onTick(): EntityChanges {
		return undefined;
	}

	onAction(action: Action): EntityChanges {
		return undefined;
	}
}

export class Observer {

}






export class PlayerEntity extends Entity {
	static handle: string = 'PlayerEntity';

	@Replicated(Type.String)
	name: string;

	@Replicated(Type.String)
	ready: boolean;

	constructor(name: string, ready: boolean, id?: string) {
		super(id);

		this.name = name;
		this.ready = !!ready;
	}

	onAction(action: Action): EntityChanges {
		if (action.type === 'READY' && action.id === this.id) {
			this.ready = action.ready;
			return new Map<string, any>([['ready', action.ready]]);
		}
	}
}


const s = new Scene();
s.registerEntity(PlayerEntity);

s.on('onSceneChanged', (changes: [Entity, EntityChanges][]) => {
	changes.forEach(([entity, changes]) => {
		if (changes === true) {
			console.log('Added', (entity.constructor as typeof Entity).name, entity.id, entity.getState());
		}
		else if (changes === undefined) {
			console.log('Removed', entity.id);
		}
		else {
			console.log('Updated', entity.id, changes);
		}
	})
})

const e1 = s.spawnEntity('PlayerEntity', 'Bob');
const e2 = s.spawnEntity('PlayerEntity', 'George');
const e3 = s.spawnEntity('PlayerEntity', 'Sophy');

s.dispatchAction({ type: 'READY', id: e1.id, ready: true });
s.removeEntity(s.getEntityById(e1.id));
s.dispatchAction({ type: 'READY', id: e3.id, ready: true });