import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { Message } from './net/Message';


interface Position {}
interface Action {
	type: string;
	[payload: string]: any;
}

class World<P extends Position> {
	entityTypes: Map<string, new(...args: any[]) => Entity<P>>;
	viewerTypes: Map<string, new(...args: any[]) => Viewer<P>>;
	entities: Set<Entity<P>>;
	viewers: Set<Viewer<P>>;

	constructor() {
		this.entityTypes = new Map<string, new(...args: any[]) => Entity<P>>();
		this.viewerTypes = new Map<string, new(...args: any[]) => Viewer<P>>();
		this.entities = new Set<Entity<P>>();
		this.viewers = new Set<Viewer<P>>();
	}
	
	registerEntityType(name: string, entity: new(...args: any[]) => Entity<P>): void {
		this.entityTypes.set(name, entity);
	}

	unregisterEntityType(name: string): void {
		this.entityTypes.delete(name);
	}
	
	registerViewerType(name: string, entity: new(...args: any[]) => Viewer<P>): void {
		this.viewerTypes.set(name, entity);
	}

	unregisterViewerType(name: string): void {
		this.viewerTypes.delete(name);
	}

	createEntity<E extends Entity<P>>(name: string, position: P): E {
		if (this.entityTypes.has(name) === false) {
			throw new ReferenceError(`Entity type ${name} is not registered in this world.`);
		}
		const type = this.entityTypes.get(name)!;
		const entity: E = new type(this, position) as E;

		this.entities.add(entity);
		entity.onEnterWorld();

		return entity;
	}

	removeEntity(entity: Entity<P>): void {
		if (this.entities.has(entity)) {
			entity.onExitWorld();
			this.entities.delete(entity);
			entity.dispose();
		}
	}

	createViewer<V extends Viewer<P>>(name: string, fov: FieldOfView<P>, position: P): V {
		if (this.viewerTypes.has(name) === false) {
			throw new ReferenceError(`Entity type ${name} is not registered in this world.`);
		}

		const type = this.viewerTypes.get(name)!;
		const viewer: V = new type(this, fov, position) as V;

		this.viewers.add(viewer);
		viewer.onEnterWorld();

		return viewer;
	}

	removeViewer(viewer: Viewer<P>): void {
		if (this.viewers.has(viewer)) {
			viewer.onExitWorld();
			this.viewers.delete(viewer);
			viewer.dispose();
		}
	}

	dispatchAction(action: Action): void {
		const newEntities: Entity<P>[] = new Array(this.entities.size);
		this.entities.forEach(entity => {
			const newEntity = entity.dispatchAction(action);

			newEntities.push(newEntity);

			// Only when entity has changed,
			if (newEntity !== entity) {
				// signal each viewer 
				this.viewers.forEach(viewer => {
					// that could see the entity
					if (viewer.entityInView(entity) || viewer.entityInView(newEntity)) {
						// signal viewer that entity has changed
						viewer.onActionInView(action, newEntity)
					}
				});
			}
		});

		this.entities.clear();
		this.entities = new Set<Entity<P>>(newEntities);
	}
}

let nextId = 0;

class Entity<P extends Position> implements IDisposable {
	private _disposed: boolean;
	readonly id: string;
	readonly world: World<P>;
	readonly position: P;


	constructor(world: World<P>, position: P)
	constructor(world: World<P>, position: P, id: string)
	constructor(world: World<P>, position: P, id?: string) {
		this.id = id || (++nextId).toString();
		this._disposed = false;
		this.world = world;
		this.position = position;
	}

	isDisposed(): boolean {
		return this._disposed;
	}

	dispose(): void {
		if (this._disposed === false) {
			(this.world as any) = undefined;
			(this.position as any) = undefined;
		}
		this._disposed = true;
	}

	dispatchAction(action: Action): Entity<P> {
		return this;
	}
	
	onEnterWorld(): void { }
	onExitWorld(): void { }
}

class Viewer<P extends Position> implements IDisposable {

	private _disposed: boolean;
	readonly id: string;
	readonly world: World<P>;
	readonly fov: FieldOfView<P>;
	readonly position: P;


	constructor(world: World<P>, fov: FieldOfView<P>, position: P)
	constructor(world: World<P>, fov: FieldOfView<P>, position: P, id: string)
	constructor(world: World<P>, fov: FieldOfView<P>, position: P, id?: string) {
		this.id = id || (++nextId).toString();
		this._disposed = false;
		this.world = world;
		this.fov = fov;
		this.position = position;
	}

	isDisposed(): boolean {
		return this._disposed;
	}

	dispose(): void {
		if (this._disposed === false) {
			(this.world as any) = undefined;
			(this.fov as any) = undefined;
			(this.position as any) = undefined;
		}
		this._disposed = true;
	}

	entityInView(entity: Entity<P>): boolean {
		return this.fov.entityInView(this, entity);
	}
	
	onEnterWorld(): void { }
	onExitWorld(): void { }
	onActionInView(action: Action, entity: Entity<P>): void { }
}

class FieldOfView<P extends Position> {
	entityInView(viewer: Viewer<P>, entity: Entity<P>): boolean {
		return true;
	}
}



class ClientViewer extends Viewer<Position> {
	onEnterWorld(): void {
		this.world.entities.forEach(entity => {
			if (this.entityInView(entity)) {
				console.log(this.id, 'viewing', entity.id);
			}
		})
	}
	onActionInView(action: Action, entity: Entity<Position>): void {
		console.log(this.id, 'action', entity.id, action);
	}
}

class PlayerEntity extends Entity<Position> {
	dispatchAction(action: Action): PlayerEntity {
		if (action.type === 'HELLO' && this.id === '2') {
			return new PlayerEntity(this.world, this.position, this.id);
		}
		return this;
	}
}

class BlindFOV extends FieldOfView<Position> {
	entityInView(viewer: Viewer<Position>, entity: Entity<Position>): boolean {
		return false;
	}
}

const godfov = new FieldOfView<Position>();
const w = new World<Position>();

w.registerEntityType('Player', PlayerEntity);
w.registerViewerType('Viewer', ClientViewer);

const p1 = w.createEntity<PlayerEntity>('Player', {});
const p2 = w.createEntity<PlayerEntity>('Player', {});
const p3 = w.createEntity<PlayerEntity>('Player', {});

const v1 = w.createViewer<ClientViewer>('Viewer', godfov, {});
const v2 = w.createViewer<ClientViewer>('Viewer', new BlindFOV(), {});
const v3 = w.createViewer<ClientViewer>('Viewer', godfov, {});

w.dispatchAction({ type: 'HELLO' });