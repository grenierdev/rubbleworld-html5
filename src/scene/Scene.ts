import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

import { Actor } from './Actor';

export type ActorSpawnedEventListener = (actor: Actor) => void;
export type ActorRemovedEventListener = (actor: Actor) => void;
export type SceneChangedEventListener = () => void;

export class Scene extends EventEmitter {

	protected nextId: number;
	protected janitor: CompositeDisposable;

	protected actors: Map<string, Actor>;
	protected actorTypes: Map<string, new (...args) => Actor>;

	constructor() {
		super();

		this.nextId = 0;
		this.janitor = new CompositeDisposable();

		this.actors = new Map<string, Actor>();
		this.actorTypes = new Map<string, new (...args) => Actor>();
	}

	disposeAsync(): Promise<void> {
		return this.janitor.disposeAsync().then(super.disposeAsync);
	}

	registerActorType(actor: new (...args) => Actor): void {
		this.actorTypes.set(actor.name, actor);
	}

	createActor<A extends Actor>(type: string, ...args: any[]): A {
		if (this.actorTypes.has(type) === false) {
			throw new ReferenceError(`Scene has no type ${type} registered yet.`);
		}

		const typeConstructor = this.actorTypes.get(type)!;
		const actor = new typeConstructor(...[this.nextId++].concat(args)) as A;
		return actor;
	}

	addActor(actor: Actor): void {
		if (this.actors.has(actor.id) === false) {
			this.actors.set(actor.id, actor);
			this.emit('onActorSpawned', actor);
			this.emit('onSceneChanged');
		}
	}

	removeActor(actor: Actor): void {
		if (this.actors.has(actor.id) === true) {
			this.actors.delete(actor.id);
			this.emit('onActorRemoved', actor);
			this.emit('onSceneChanged');
		}
	}

	getActorById<A extends Actor>(id: string): A | undefined {
		return this.actors.get(id) as A;
	}

	getActorByType<A extends Actor>(kind: string): A[] {
		return Array.from<Actor>(this.actors.values()).filter((actor) => actor.constructor.name === kind) as A[];
	}

	update(): void {
		this.actors.forEach((actor: Actor, id: string) => {
			actor.onUpdate();
		});
	}

	fixedUpdate(): void {
		this.actors.forEach((actor: Actor, id: string) => {
			actor.onFixedUpdate();
		});
	}

	render(): void {
		this.actors.forEach((actor: Actor, id: string) => {
			actor.onRender();
		});
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
