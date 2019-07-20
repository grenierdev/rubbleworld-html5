import { Mutable } from './util/Mutable';
import { Matrix4, ReadonlyMatrix4 } from './math/Matrix4';
import { Debug } from './Debug';

export interface UpdateContext {
	time: number;
	deltaTime: number;
	frameCount: number;
	timeScale: number;
	debug?: Debug;
}

export interface FixedUpdateContext {
	time: number;
	deltaTime: number;
	timeScale: number;
	debug?: Debug;
}

export interface RenderContext {
	time: number;
	deltaTime: number;
	timeScale: number;
	frameCount: number;
	debug?: Debug;
	gl: WebGLRenderingContext;
	viewMatrix: Matrix4 | ReadonlyMatrix4;
	projectionMatrix: Matrix4 | ReadonlyMatrix4;
}

export abstract class Component {
	public executionOrder: number = 0;
	public renderOrder: number = 0;
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
			return this.entity.getComponent(type);
		}
		return undefined;
	}

	getComponents<T>(type: new (...args: any[]) => T): T[] {
		if (this.entity) {
			return this.entity.getComponents(type);
		}
		return [];
	}

	didMount?(): void;
	willUnmount?(): void;
	update?(context: UpdateContext): IterableIterator<void> | void;
	fixedUpdate?(context: FixedUpdateContext): IterableIterator<void> | void;
	render?(context: RenderContext): void;
}

export class Entity {
	public readonly parent: undefined | Entity;
	public readonly enabled: boolean;
	public readonly children: Entity[];
	public readonly components: Component[];

	constructor(public name: string, ...components: Component[]) {
		this.enabled = true;
		this.children = [];
		this.components = [];
		for (const component of components) {
			this.addComponent(component);
		}
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
		const component = this.components.find(component => component.constructor === type);
		if (component) {
			return component as any;
		}
	}

	getComponents<T>(type: new (...args: any[]) => T): T[] {
		return this.components.filter(component => component.constructor === type) as any;
	}

	private addComponent(...components: Component[]) {
		for (const component of components) {
			this.components.push(component);
			(component as Mutable<Component>).entity = this;
		}
		return this;
	}
}

export class Scene extends Entity {
	/** @internal */
	public readonly updatableComponents: Component[];
	/** @internal */
	public readonly renderableComponents: Component[];
	/** @internal */
	public readonly entitiesToAdd: Entity[];
	/** @internal */
	public readonly entitiesToRemove: Entity[];

	constructor() {
		super('Scene');
		this.updatableComponents = [];
		this.renderableComponents = [];
		this.entitiesToAdd = [];
		this.entitiesToRemove = [];
	}

	get scene(): Scene | undefined {
		if (this.parent) {
			return this.parent.scene;
		}
		return this;
	}

	*update(context: UpdateContext) {
		let changed = false;

		// Remove entities of the scene
		if (this.entitiesToRemove.length) {
			for (const entityToRemove of this.entitiesToRemove) {
				const entities = [entityToRemove, ...entityToRemove.getChildren(true)];
				for (const entity of entities) {
					for (const component of entity.components) {
						let i = this.updatableComponents.indexOf(component);
						let unmounted = false;
						if (i > -1) {
							changed = true;
							this.updatableComponents.splice(i, 1);
							if (component.willUnmount) {
								component.willUnmount();
								unmounted = true;
								yield;
							}
						}

						i = this.renderableComponents.indexOf(component);
						if (i > -1) {
							changed = true;
							this.renderableComponents.splice(i, 1);
							if (!unmounted && component.willUnmount) {
								component.willUnmount();
								yield;
							}
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
						changed = true;
						if (component.didMount) {
							component.didMount();
							yield;
						}
						if (component.update || component.fixedUpdate) {
							this.updatableComponents.push(component);
						}
						if (component.render) {
							this.renderableComponents.push(component);
						}
					}
				}
			}
			this.entitiesToAdd.splice(0, this.entitiesToAdd.length);
		}

		// Something changed, reorder components
		if (changed) {
			this.updatableComponents.sort((a, b) => a.executionOrder - b.executionOrder);
			this.renderableComponents.sort((a, b) => a.executionOrder - b.executionOrder);
		}

		// Update component
		for (const component of this.updatableComponents) {
			if (component.enabled && component.entity && component.entity.enabled && component.update) {
				yield component.update(context);
			}
		}
	}

	*render(context: RenderContext) {
		for (const component of this.renderableComponents) {
			if (component.enabled && component.render && component.entity && component.entity.enabled) {
				component.render(context);
				yield;
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
