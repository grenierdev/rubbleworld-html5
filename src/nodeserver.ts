import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { Message } from './net/Message';

interface Action {
	type: string;
	[payload: string]: any;
}

let nextId = 0;
export function generateId(): string {
	return (++nextId).toString();
}

export class World {

	viewers: Immutable.List<Viewer>;
	entities: Immutable.List<Entity>;

	constructor() {
		this.viewers = Immutable.List<Viewer>();
		this.entities = Immutable.List<Entity>();
	}

	toJSON(): any {
		return {
			entities: Array.from(this.entities.toArray()).map(entity => entity.toJSON())
		};
	}

	addEntity(entity: Entity): void {
		if (this.entities.indexOf(entity) === -1) {
			this.entities = this.entities.push(entity);
			entity.setWorld(this);
			// TODO this.onEntityAdded
		}
	}

	removeEntity(entity: Entity): void {
		const idx = this.entities.indexOf(entity);
		if (idx > -1) {
			entity.unsetWorld();
			this.entities = this.entities.delete(idx);
			// TODO this.onEntityRemoved
		}
	}

	addViewer(viewer: Viewer): void {
		if (this.viewers.indexOf(viewer) === -1) {
			this.viewers = this.viewers.push(viewer);
			viewer.setWorld(this);
			// TODO this.onViewerAdded
		}
	}

	removeViewer(viewer: Viewer): void {
		const idx = this.viewers.indexOf(viewer);
		if (idx > -1) {
			viewer.unsetWorld();
			this.viewers = this.viewers.delete(idx);
			// TODO this.onViewerRemoved
		}
	}

	dispatchAction(action: Action): void {
		this.entities = this.entities.withMutations(entities => {
			entities.forEach((entity: Entity, idx: number) => {
				const newEntity = entity.doAction(action);
				if (newEntity !== entity) {
					entities.set(idx, newEntity);
				}
			});
		});
	}
}

export abstract class Entity {

	readonly id: string;
	protected world?: World;

	constructor(id?: string) {
		this.id = id || generateId();
	}

	toJSON(): any {
		return {
			id: this.id
		};
	}

	setWorld(world: World): void {
		this.world = world;
		// TODO entity.onSpawned
	}

	unsetWorld(): void {
		// TODO entity.onDespawned
		this.world = undefined;
	}

	abstract doAction(action: Action): Entity;
}

export abstract class Viewer {

	readonly id: string;
	protected world?: World;

	pawns: Immutable.Set<Entity>;

	constructor(id?: string) {
		this.id = id || generateId();
		this.pawns = Immutable.Set<Entity>();
	}

	addPawn(entity: Entity): void {
		if (this.pawns.has(entity) === false) {
			this.pawns = this.pawns.add(entity);
			// TODO this.onPawnAdded
		}
	}

	removePawn(entity: Entity): void {
		if (this.pawns.has(entity) === false) {
			this.pawns = this.pawns.delete(entity);
			// TODO this.onPawnRemoved
		}
	}

	setWorld(world: World): void {
		this.world = world;
		// TODO entity.onSpawned
	}

	unsetWorld(): void {
		// TODO entity.onDespawned
		this.world = undefined;
	}
}

class PlayerViewer extends Viewer {

}

class PlayerEntity extends Entity {

	readonly name: string;

	constructor(name: string, id?: string) {
		super(id);
		this.name = name;
	}

	toJSON(): any {
		return Object.assign(super.toJSON(), {
			name: this.name
		});
	}

	doAction(action: Action): Entity {
		if (action.type === 'HELLO' && action.name === this.name) {
			return new PlayerEntity(`Hello${this.name}`, this.id);
		}
		return this;
	}
}

const w = new World();
const v1 = new PlayerViewer();
const v2 = new PlayerViewer();
const e1 = new PlayerEntity('Bob');
const e2 = new PlayerEntity('George');

v1.addPawn(e1);
v2.addPawn(e2);
w.addEntity(e1);
w.addEntity(e2);
w.addViewer(v1);
w.addViewer(v2);

console.log(w.toJSON());
w.dispatchAction({ type: 'HELLO', name: 'Bob' });
console.log(w.toJSON());
