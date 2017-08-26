import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import "reflect-metadata";

interface Action {
	type: string;
	[payload: string]: any;
}

export function Replicated(type: typeof String | typeof Number | typeof Boolean) {
	return function (entity: Entity, key: string) {
		(entity.constructor as typeof Entity).replications.push([key, type]);
	}
}


let nextId = 0;
export function generateId(): string {
	return (++nextId).toString();
}

export class Scene extends EventEmitter {

	private entities: Immutable.Map<string, Entity>;
	private types: Immutable.Map<string, new(...args) => Entity>;

	constructor()
	constructor(entities: Immutable.Map<string, Entity>, types: Immutable.Map<string, new(...args) => Entity>)
	constructor(entities?: Immutable.Map<string, Entity>, types?: Immutable.Map<string, new(...args) => Entity>) {
		super();

		this.entities = entities || Immutable.Map<string, Entity>();
		this.types = types || Immutable.Map<string, typeof Entity>();
	}

	registerEntity(...entities: (new(...args) => Entity)[]): void {
		const types = this.types.withMutations(types => {
			entities.forEach(entity => types.set((entity as typeof Entity).handle, entity));
		});
		if (types !== this.types) {
			this.types = types;
			this.emit('onNewEntityRegistered', entities);
		}
	}

	spawnEntity<E extends Entity>(handle: string, ...args: any[]): E {
		if (this.types.has(handle) === false) {
			throw new ReferenceError(`Entity ${handle} is not registered.`);
		}
		const type = this.types.get(handle);
		const entity = new type(...args) as E;

		this.entities = this.entities.set(entity.id, entity);
		this.emit('onEntitySpawned', entity);
		this.emit('onSceneChanged', [[undefined, entity]]);

		return entity;
	}

	removeEntity(entity: Entity): void {
		if (this.entities.has(entity.id) === true) {
			this.entities = this.entities.delete(entity.id);
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
		const entitiesChanged: [Entity, Entity][] = [];
		const newEntities = this.entities.withMutations(entities => {
			entities.forEach((entity: Entity, id: string) => {
				const newEntity = entity.onTick();
				if (newEntity !== entity) {
					entitiesChanged.push([entity, newEntity]);
					entities.set(id, newEntity);
				}
			});
		});

		if (newEntities !== this.entities) {
			this.entities = newEntities;
			this.emit('onSceneChanged', entitiesChanged);
		}
	}

	dispatchAction(action: Action): void {
		const entitiesChanged: [Entity, Entity][] = [];
		const newEntities = this.entities.withMutations(entities => {
			entities.forEach((entity: Entity, id: string) => {
				const newEntity = entity.onAction(action);
				if (newEntity !== entity) {
					entitiesChanged.push([entity, newEntity]);
					entities.set(id, newEntity);
				}
			});
		});

		if (newEntities !== this.entities) {
			this.entities = newEntities;
			this.emit('onSceneChanged', entitiesChanged);
		}
	}

}

export class Entity {
	static handle: string = 'Entity';
	static replications: [string, typeof String | typeof Number | typeof Boolean][] = [];

	readonly id: string;

	constructor()
	constructor(id: string | undefined)
	constructor(id?: string) {
		this.id = id || generateId();
	}

	onTick(): Entity {
		return this;
	}

	onAction(action: Action): Entity {
		return this;
	}

	getDiff(previous?: Entity): Map<string, any> {
		const replications = (this.constructor as typeof Entity).replications;
		const diff: Map<string, any> = new Map<string, any>();

		replications.forEach(([key, type]) => {
			if (previous === undefined || this[key] !== previous[key]) {
				diff.set(key, this[key]);
			}
		});

		return diff;
	}
}

export class Observer {

}






export class PlayerEntity extends Entity {
	static handle: string = 'PlayerEntity';

	@Replicated(String)
	readonly name: string;

	@Replicated(Boolean)
	readonly ready: boolean;

	constructor(name: string, ready: boolean, id?: string) {
		super(id);

		this.name = name;
		this.ready = !!ready;
	}

	onAction(action: Action): PlayerEntity {
		if (action.type === 'READY' && action.id === this.id) {
			return new PlayerEntity(this.name, action.ready, this.id);
		}
		return this;
	}
}


const s = new Scene();
s.registerEntity(PlayerEntity);

s.on('onSceneChanged', (changes: [Entity, Entity][]) => {
	changes.forEach(([previous, next]) => {
		if (previous === undefined) {
			console.log('Added', (next.constructor as typeof Entity).handle, next.id, next.getDiff(previous));
		}
		else if (next === undefined) {
			console.log('Removed', previous.id);
		}
		else {
			console.log('Updated', next.id, next.getDiff(previous));
		}
	})
})

const e1 = s.spawnEntity('PlayerEntity', 'Bob');
const e2 = s.spawnEntity('PlayerEntity', 'George');
const e3 = s.spawnEntity('PlayerEntity', 'Sophy');

s.dispatchAction({ type: 'READY', id: e1.id, ready: true });
s.removeEntity(s.getEntityById(e1.id));
s.dispatchAction({ type: 'READY', id: e3.id, ready: true });