import { Mutable } from './util/Mutable';

export abstract class Component {
	public static readonly executionOrder: number = 0;
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;

	constructor() {
		this.enabled = true;
	}

	setEnable(enabled: boolean) {
		(this as Mutable<Component>).enabled = !!enabled;
		return this;
	}

	getComponent<T>(type: new (...args: any[]) => T): T | undefined {
		if (this.entity) {
			return this.entity.getComponent(type) as any;
		}
		return undefined;
	}

	willMount?(): void;
	willUnmount?(): void;
	update?(): IterableIterator<void> | void;
	render?(camera: CameraComponent): void;
}

export class Entity {
	public readonly parent: undefined | Entity;
	public readonly enabled: boolean;
	public readonly children: Entity[];
	public readonly components: Component[];

	public static build({
		name,
		enabled,
		children,
		components,
	}: {
		name: string;
		enabled?: boolean;
		children?: Entity[];
		components?: Component[];
	}) {
		return new Entity(name)
			.setEnable(enabled === undefined ? true : enabled)
			.addChild(...(children || []))
			.addComponent(...(components || []));
	}

	constructor(public name: string) {
		this.enabled = true;
		this.children = [];
		this.components = [];
	}

	get scene(): Scene | undefined {
		if (this.parent) {
			return this.parent instanceof Scene ? this.parent : this.parent.scene;
		}
	}

	setEnable(enabled: boolean) {
		(this as Mutable<Entity>).enabled = !!enabled;
		return this;
	}

	addChild(...entities: Entity[]) {
		for (const entity of entities) {
			if (this.children.indexOf(entity) === -1) {
				this.children.push(entity);
				(entity as Mutable<Entity>).parent = this;
				const scene = this.scene;
				if (scene) {
					scene.entitiesToAdd.push(entity);
				}
			}
		}
		return this;
	}

	removeChild(...entities: Entity[]) {
		for (const entity of entities) {
			const idx = this.children.indexOf(entity);
			if (idx > -1) {
				this.children.splice(idx, 1);
				const scene = this.scene;
				if (scene) {
					scene.entitiesToRemove.push(entity);
				}
			}
		}
		return this;
	}

	getChildren(recursive = false) {
		if (!recursive) {
			return [...this.children];
		}
		return this.children.reduce(
			(children, child) => {
				children.push(child, ...child.getChildren(true));
				return children;
			},
			[] as Entity[]
		);
	}

	getComponent<T>(type: new (...args: any[]) => T): T | undefined {
		const component = this.components.find(
			component => component.constructor === type
		);
		if (component) {
			return component as any;
		}
	}

	addComponent(...components: Component[]) {
		for (const component of components) {
			this.components.push(component);
			(component as Mutable<Component>).entity = this;
		}
		return this;
	}
}

export class Scene extends Entity {
	public readonly everyComponentsInTree: ReadonlyArray<Component>;
	/** @internal */
	public readonly entitiesToAdd: Entity[];
	/** @internal */
	public readonly entitiesToRemove: Entity[];

	constructor() {
		super('Scene');
		this.everyComponentsInTree = [];
		this.entitiesToAdd = [];
		this.entitiesToRemove = [];
	}

	get scene(): Scene | undefined {
		if (this.parent) {
			return this.parent.scene;
		}
		return this;
	}

	*update() {
		let changed = false;

		// Add newly added entities to the scene
		if (this.entitiesToAdd.length) {
			for (const entityToAdd of this.entitiesToAdd) {
				const entities = [entityToAdd, ...entityToAdd.getChildren(true)];
				for (const entity of entities) {
					for (const component of entity.components) {
						changed = true;
						(this.everyComponentsInTree as Component[]).push(component);
						if (component.willMount) {
							component.willMount();
							yield component;
						}
					}
				}
			}
			this.entitiesToAdd.splice(0, this.entitiesToAdd.length);
		}

		// Remove entities of the scene
		if (this.entitiesToRemove.length) {
			for (const entityToRemove of this.entitiesToRemove) {
				const entities = [entityToRemove, ...entityToRemove.getChildren(true)];
				for (const entity of entities) {
					for (const component of entity.components) {
						const i = this.everyComponentsInTree.indexOf(component);
						if (i > -1) {
							changed = true;
							(this.everyComponentsInTree as Component[]).splice(i, 1);
							if (component.willUnmount) {
								component.willUnmount();
								yield component;
							}
						}
					}
					(entity as Mutable<Entity>).parent = undefined;
				}
			}
			this.entitiesToRemove.splice(0, this.entitiesToRemove.length);
		}

		// Something changed, reorder components
		if (changed) {
			(this.everyComponentsInTree as Component[]).sort(
				(a, b) =>
					(a.constructor as typeof Component).executionOrder -
					(b.constructor as typeof Component).executionOrder
			);
		}

		// Update component
		for (const component of this.everyComponentsInTree) {
			if (component.enabled && component.entity && component.entity.enabled) {
				component.update && component.update();
				yield component;
			}
		}
	}

	*render(camera: CameraComponent) {
		for (const component of this.everyComponentsInTree) {
			if (
				component.enabled &&
				component.render &&
				component.entity &&
				component.entity.enabled
			) {
				component.render(camera);
				yield component;
			}
		}
	}
}

import { CameraComponent } from './components/Camera'; // hack circular dependency
