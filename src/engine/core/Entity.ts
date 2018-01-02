import { IDisposableAsync } from 'konstellio-disposable';
import { EventEmitter } from 'konstellio-eventemitter';
import { PriorityList } from './PriorityList';

export abstract class Entity extends EventEmitter implements IDisposableAsync {

	private disposed: boolean;

	readonly parent?: Entity;
	readonly children: PriorityList<Entity>;
	readonly components: PriorityList<Component>;

	constructor() {
		super();
		this.disposed = false;
		this.children = new PriorityList<Entity>();
		this.components = new PriorityList<Component>();
	}

	disposeAsync(): Promise<void> {
		if (this.disposed === false) {
			this.disposed = true;
			this.children! = undefined!;
			this.components! = undefined!;
		}
		return Promise.resolve();
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	addChild(child: Entity, priority?: number): void {
		if (this.disposed === true) {
			throw new Error(`Cannot add a child to a disposed Entity.`);
		}
		if (this.children.contains(child) === false) {
			if (child.parent !== undefined) {
				child.parent.removeChild(child);
			}
			this.children.add(child, priority);
			child.parent! = this;
			child.onEntityAdded();
		}
	}

	removeChild(child: Entity): void {
		if (this.disposed === true) {
			throw new Error(`Cannot remove a child to a disposed Entity.`);
		}
		if (this.children.contains(child) === true) {
			this.children.remove(child);
			child.parent! = undefined!;
			child.onEntityRemoved();
		}
	}

	containsChild(child: Entity): boolean {
		if (this.disposed === true) {
			throw new Error(`Cannot lookup a child to a disposed Entity.`);
		}
		return this.children.contains(child);
	}

	getChildrenByType<T extends Entity>(type: new () => T, deep?: boolean): T[] {
		return this.children.reduce((acc, entity) => {
			if (entity.constructor === type) {
				acc.push(entity as T);
			}
			return !!deep ? acc.concat(entity.getChildrenByType(type)) : acc;
		}, [] as T[]);
	}

	addComponent(component: Component, priority?: number): void {
		if (this.disposed === true) {
			throw new Error(`Cannot add a component to a disposed Entity.`);
		}
		if (this.components.contains(component) === false) {
			this.components.add(component, priority);
			component.owner! = this;
			component.onComponentMounted();
			this.onComponentMounted(component);
		}
	}

	removeComponent(component: Component): void {
		if (this.disposed === true) {
			throw new Error(`Cannot remove a component to a disposed Entity.`);
		}
		if (this.components.contains(component) === true) {
			this.onComponentUnmounted(component);
			this.components.remove(component);
			component.owner! = undefined!;
			component.onComponentUnmounted();
		}
	}

	containsComponent(component: Component): boolean {
		if (this.disposed === true) {
			throw new Error(`Cannot lookup a component to a disposed Entity.`);
		}
		return this.components.contains(component);
	}

	getComponentsByType<T extends Component>(type: new () => T): T[] {
		return this.components.reduce((acc, component) => {
			if (component.constructor === type) {
				acc.push(component as T);
			}
			return acc;
		}, [] as T[]);
	}

	onEntityAdded(): void {
		this.emit('onEntityAdded');
	}

	onEntityRemoved(): void {
		this.emit('onEntityRemoved');
	}

	onComponentMounted(component: Component): void {
		this.emit('onComponentMounted', component);
	}

	onComponentUnmounted(component: Component): void {
		this.emit('onComponentUnmounted', component);
	}
}

export abstract class Component extends EventEmitter implements IDisposableAsync {

	private disposed: boolean;

	readonly owner?: Entity;

	disposeAsync(): Promise<void> {
		if (this.disposed === false) {
			this.disposed = true;
		}
		return Promise.resolve();
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	onComponentMounted(): void {
		this.emit('onComponentMounted');
	}

	onComponentUnmounted(): void {
		this.emit('onComponentUnmounted');
	}
}

export class NullEntity extends Entity {

}