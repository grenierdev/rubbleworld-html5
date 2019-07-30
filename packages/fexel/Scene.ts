import { Mutable } from './util/Mutable';
import { Debug } from './rendering/Debug';

export interface UpdateContext {
	time: number;
	deltaTime: number;
	fixedTime: number;
	fixedDeltaTime: number;
	frameCount: number;
	timeScale: number;
	debug?: Debug;
	canvas?: HTMLCanvasElement;
	gl?: WebGLRenderingContext;
}

export interface FixedUpdateContext {
	time: number;
	deltaTime: number;
	fixedTime: number;
	fixedDeltaTime: number;
	timeScale: number;
	debug?: Debug;
}

function updateEntityScenePosition(scene: Scene) {
	const queue: Entity[] = [scene];
	let i = 0;
	let node: Entity | undefined;
	while ((node = queue.shift())) {
		node.scenePosition = ++i;
		queue.unshift(...node.children);
	}
}

export type ComponentConstructor<T extends Component> = (new (...args: any[]) => T) | { prototype: T };

export abstract class Component {
	public executionOrder: number = 0;
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;

	constructor() {
		this.enabled = true;
	}

	setEnable(enabled: boolean) {
		(this as Mutable<Component>).enabled = !!enabled;
		return this;
	}

	getComponent<T extends Component>(type: ComponentConstructor<T>): T | undefined {
		if (this.entity) {
			return this.entity.getComponent(type);
		}
		return undefined;
	}

	getComponents<T extends Component>(type: ComponentConstructor<T>, recursive = false): T[] {
		if (this.entity) {
			return this.entity.getComponents(type, recursive);
		}
		return [];
	}

	didMount?(): void;
	willUnmount?(): void;
	update?(context: UpdateContext): IterableIterator<void> | void;
	fixedUpdate?(context: FixedUpdateContext): IterableIterator<void> | void;
}

export class Entity {
	public readonly parent: undefined | Entity;
	public readonly enabled: boolean = true;
	public readonly children: Entity[] = [];
	public readonly components: Component[] = [];
	/** @internal */
	scenePosition: number = 0;

	constructor(public name: string, components: Component[] = [], children: Entity[] = []) {
		this.addComponent(...components);
		this.addChild(...children);
	}

	/** @internal */
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
			if (!this.children.includes(entity)) {
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

	addComponent(...components: Component[]) {
		for (const component of components) {
			if (!this.components.includes(component)) {
				this.components.push(component);
				this.components.sort((a, b) => a.executionOrder - b.executionOrder);
				(component as Mutable<Component>).entity = this;
				const scene = this.scene;
				if (scene) {
					scene.componentsToAdd.push(component);
				}
			}
		}
		return this;
	}

	removeComponent(...components: Component[]) {
		for (const component of components) {
			const idx = this.components.indexOf(component);
			if (idx > -1) {
				this.components.splice(idx, 1);
				const scene = this.scene;
				if (scene) {
					scene.componentsToRemove.push(component);
				}
			}
		}
		return this;
	}

	getComponent<T extends Component>(type: ComponentConstructor<T>): T | undefined {
		const component = this.components.find(component => component instanceof (type as Function));
		if (component) {
			return component as any;
		}
	}

	getComponents<T extends Component>(type: ComponentConstructor<T>, recursive = false): T[] {
		if (recursive === true) {
			const components = [
				...this.components,
				...this.getChildren(true).reduce(
					(components, entity) => {
						components.push(...entity.components);
						return components;
					},
					[] as Component[]
				),
			];
			return components.filter(component => component instanceof (type as Function)) as any;
		}
		return this.components.filter(component => component instanceof (type as Function)) as any;
	}
}

export class Scene extends Entity {
	/** @internal */
	public readonly updatableComponents: Component[] = [];
	/** @internal */
	public readonly entitiesToAdd: Entity[] = [];
	/** @internal */
	public readonly entitiesToRemove: Entity[] = [];
	/** @internal */
	public readonly componentsToAdd: Component[] = [];
	/** @internal */
	public readonly componentsToRemove: Component[] = [];

	constructor(components: Component[] = [], children: Entity[] = []) {
		super('Scene');
		this.addComponent(...components);
		this.addChild(...children);
	}

	get scene(): Scene | undefined {
		if (this.parent) {
			return this.parent.scene;
		}
		return this;
	}

	*update(context: UpdateContext) {
		let needReorder = false;

		// Remove entities of the scene
		if (this.entitiesToRemove.length) {
			for (const entityToRemove of this.entitiesToRemove) {
				const entities = [entityToRemove, ...entityToRemove.getChildren(true)];
				for (const entity of entities) {
					for (const component of entity.components) {
						if (component.willUnmount) {
							component.willUnmount();
							yield;
						}
						let i = this.updatableComponents.indexOf(component);
						if (i > -1) {
							this.updatableComponents.splice(i, 1);
						}
					}
					(entity as Mutable<Entity>).parent = undefined;
				}
			}
			this.entitiesToRemove.splice(0, this.entitiesToRemove.length);
		}

		// Add newly added entities to the scene
		if (this.entitiesToAdd.length) {
			for (const entityToAdd of this.entitiesToAdd) {
				const entities = [entityToAdd, ...entityToAdd.getChildren(true)];
				for (const entity of entities) {
					for (const component of entity.components) {
						needReorder = true;
						if (component.didMount) {
							component.didMount();
							yield;
						}
						if (component.update || component.fixedUpdate) {
							this.updatableComponents.push(component);
						}
					}
				}
			}
			this.entitiesToAdd.splice(0, this.entitiesToAdd.length);
		}

		// Remove components of the scene
		if (this.componentsToRemove.length) {
			for (const component of this.componentsToRemove) {
				let i = this.updatableComponents.indexOf(component);
				if (i > -1) {
					if (component.willUnmount) {
						component.willUnmount();
						yield;
					}
					this.updatableComponents.splice(i, 1);
				}
			}
			this.componentsToRemove.splice(0, this.componentsToRemove.length);
		}

		// Add newly added components
		if (this.componentsToAdd.length) {
			for (const component of this.componentsToAdd) {
				needReorder = true;
				if (component.didMount) {
					component.didMount();
					yield;
				}
				if (component.update || component.fixedUpdate) {
					this.updatableComponents.push(component);
				}
			}
			this.componentsToAdd.splice(0, this.componentsToAdd.length);
		}

		// Something changed, reorder components
		if (needReorder) {
			updateEntityScenePosition(this);
			this.updatableComponents.sort((a, b) => {
				const d = a.executionOrder - b.executionOrder;
				if (d === 0) {
					return a.entity!.scenePosition - b.entity!.scenePosition;
				}
				return d;
			});
		}

		// Update component
		for (const component of this.updatableComponents) {
			if (component.enabled && component.entity && component.entity.enabled && component.update) {
				yield component.update(context);
			}
		}
	}

	*fixedUpdate(context: FixedUpdateContext) {
		for (const component of this.updatableComponents) {
			if (component.enabled && component.fixedUpdate && component.entity && component.entity.enabled) {
				yield component.fixedUpdate(context);
			}
		}
	}
}
