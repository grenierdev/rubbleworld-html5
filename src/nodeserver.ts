import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { Message } from './net/Message';


interface Position {}
interface Action {
	type: string;
	[payload: string]: any;
}

class World<T extends Position> {
	entities: Set<Entity<T>>;
	viewers: Set<Viewer<T>>;

	constructor() {
		this.entities = new Set<Entity<T>>();
		this.viewers = new Set<Viewer<T>>();
	}

	dispatchAction(action: Action): void {
		this.entities.forEach(entity => {
			const newEntity = entity.dispatchAction(action);

			// Only when entity has changed,
			if (newEntity !== entity) {
				// signal each viewer 
				this.viewers.forEach(viewer => {
					// that could see the entity
					if (viewer.entityInView(entity) || viewer.entityInView(newEntity)) {
						// signal viewer that entity has changed
						viewer.dispatchActionInView(action, newEntity)
					}
				});
			}
		});
	}
}

let nextId = 0;

class Entity<T extends Position> implements IDisposable {
	private _disposed: boolean;
	readonly id: number;
	readonly world: World<T>;
	readonly position: T;


	constructor(world: World<T>, position: T)
	constructor(world: World<T>, position: T, id?: number) {
		this.id = id || ++nextId;
		this._disposed = false;
		this.world = world;
		this.position = position;

		this.world.entities.add(this);
	}

	isDisposed(): boolean {
		return this._disposed;
	}

	dispose(): void {
		if (this._disposed === false) {
			this.world.entities.delete(this);
			(this.world as any) = undefined;
			(this.position as any) = undefined;
		}
		this._disposed = true;
	}

	dispatchAction(action: Action): Entity<T> {
		return this;
	}
}

class Viewer<T extends Position> implements IDisposable {
	private _disposed: boolean;
	readonly id: number;
	readonly world: World<T>;
	readonly fov: FieldOfView<T>;
	readonly position: T;

	constructor(world: World<T>, fov: FieldOfView<T>, position: T)
	constructor(world: World<T>, fov: FieldOfView<T>, position: T, id?: number) {
		this.id = id || ++nextId;
		this._disposed = false;
		this.world = world;
		this.fov = fov;
		this.position = position;

		this.world.viewers.add(this);
	}

	isDisposed(): boolean {
		return this._disposed;
	}

	dispose(): void {
		if (this._disposed === false) {
			this.world.viewers.delete(this);
			(this.world as any) = undefined;
			(this.fov as any) = undefined;
			(this.position as any) = undefined;
		}
		this._disposed = true;
	}

	entityInView(entity: Entity<T>): boolean {
		if (this.isDisposed()) {
			throw new Error(`Viewer is disposed.`);
		}
		return this.fov.entityInView(this, entity);
	}

	dispatchActionInView(action: Action, entity: Entity<T>): void {

	}
}

class FieldOfView<T extends Position> {
	entityInView(viewer: Viewer<T>, entity: Entity<T>): boolean {
		return true;
	}
}


const lobby = new World<Position>();
const godfov = new FieldOfView<Position>();

const p1 = new Entity<Position>(lobby, {});
const p2 = new Entity<Position>(lobby, {});
const p3 = new Entity<Position>(lobby, {});

const c1 = new Viewer<Position>(lobby, godfov, {});
const c2 = new Viewer<Position>(lobby, godfov, {});
const c3 = new Viewer<Position>(lobby, godfov, {});


// interface GridPosition extends Position {
// 	x: number;
// 	y: number;
// }

// class GridFOV implements FieldOfView<GridPosition> {

// 	distance: number;

// 	constructor(distance: number) {
// 		this.distance = distance;
// 	}

// 	entityInView(viewer: Viewer<GridPosition>, entity: Entity<GridPosition>): boolean {
// 		if (viewer.world === entity.world) {
// 			return Math.abs(viewer.position.x - entity.position.x) + Math.abs(viewer.position.y - entity.position.y) <= this.distance;
// 		}

// 		return false;
// 	}
// }

// const w = new World<GridPosition>();

// const v = new Viewer<GridPosition>(
// 	w,
// 	new GridFOV(2),
// 	{ x: 0, y: 0 }
// );

// const e1 = new Entity<GridPosition>(w, { x: 1, y: 0 });
// const e2 = new Entity<GridPosition>(w, { x: -4, y: 0 });


