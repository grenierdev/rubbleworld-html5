import { Mutable } from './util/Mutable';

export abstract class Component {
	public static readonly executionOrder = 0;
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;
	public readonly mounted: boolean;

	private cachedUpdateGenerator: IterableIterator<any> | false | undefined;
	private cachedLateUpdateGenerator: IterableIterator<any> | false | undefined;

	constructor() {
		this.enabled = true;
		this.mounted = false;
	}

	getComponent<T extends Component>(type: any): T | undefined {
		if (this.entity) {
			return this.entity.getComponent(type);
		}
		return undefined;
	}

	onStart(): void {}
	onStop(): void {}
	onUpdate(): IterableIterator<void> | void {}
	onLateUpdate(): IterableIterator<void> | void {}
	onRender(): void {}
}

interface ComponentCachedGenerator {
	cachedUpdateGenerator: undefined | false | IterableIterator<void>;
	cachedLateUpdateGenerator: undefined | false | IterableIterator<void>;
	cachedFixedUpdateGenerator: undefined | false | IterableIterator<void>;
}

export class Entity {
	public readonly parent: undefined | Entity;
	public readonly enabled: boolean;
	public readonly children: Entity[];
	public readonly components: Component[];
	public readonly mounted: boolean;

	constructor(
		public name: string,
		components: Component[] = [],
		children: Entity[] = []
	) {
		this.enabled = true;
		this.mounted = false;
		this.children = [];
		this.components = [];

		for (const component of components) {
			this.components.push(component);
			(component as any).entity = this;
		}

		for (const child of children) {
			this.addChild(child);
		}
	}

	setEnable(enabled: boolean) {
		(this as any).enabled = enabled;
	}

	addChild(entity: Entity) {
		if (this.children.indexOf(entity) === -1) {
			this.children.push(entity);
			(entity as any).parent = this;
		}
	}

	removeChild(entity: Entity) {
		const idx = this.children.indexOf(entity);
		if (idx > -1) {
			this.children.splice(idx, 1);
			(entity as any).parent = undefined;
			for (const component of entity.components) {
				component.onStop();
			}
		}
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

	getComponent<T extends Component>(type: any): T | undefined {
		const component = this.components.find(
			component => component.constructor === type
		);
		if (component) {
			return component as T;
		}
	}
}

export class Scene extends Entity {
	protected readonly allComponents: Component[];

	constructor(children: Entity[] = []) {
		super('Scene', [], children);
		this.allComponents = [];
	}

	*update(): IterableIterator<void> {
		const entities: Entity[] = this.getChildren(true);
		for (const entity of entities) {
			// Entity is part of the tree and is not yet mounted
			if (entity.parent && !entity.mounted) {
				(entity as Mutable<Entity>).mounted = true;
				this.allComponents.push(
					...entity.components.sort(
						(a, b) =>
							(a.constructor as typeof Component).executionOrder -
							(b.constructor as typeof Component).executionOrder
					)
				);
			}
		}

		const activeComponents: Component[] = [];
		const inactiveComponents: Component[] = [];
		for (const component of this.allComponents) {
			// Component no longer attached to entity (?) and no longer part of the tree
			if (!component.entity || !component.entity.parent) {
				inactiveComponents.push(component);
			} else {
				activeComponents.push(component);
			}
		}

		for (const component of inactiveComponents) {
			component.onStop();
			(component as Mutable<Component>).mounted = false;
		}

		for (const component of activeComponents) {
			if (component.enabled && component.entity && component.entity.enabled) {
				if (!component.mounted) {
					component.onStart();
					(component as Mutable<Component>).mounted = true;
				}
				callIteratorAndCacheResult(
					component,
					'onUpdate',
					'cachedUpdateGenerator'
				);
				yield;
			}
		}

		this.allComponents.splice(
			0,
			this.allComponents.length,
			...activeComponents
		);

		for (const component of activeComponents) {
			if (component.enabled && component.entity && component.entity.enabled) {
				callIteratorAndCacheResult(
					component,
					'onLateUpdate',
					'cachedLateUpdateGenerator'
				);
				yield;
			}
		}
	}

	*fixedUpdate(): IterableIterator<void> {
		for (const component of this.allComponents) {
			if (component.enabled && component.entity && component.entity.enabled) {
				callIteratorAndCacheResult(
					component,
					'onFixedUpdate',
					'cachedFixedUpdateGenerator'
				);
				yield;
			}
		}
	}

	*render(): IterableIterator<void> {
		for (const component of this.allComponents) {
			if (component.enabled && component.entity && component.entity.enabled) {
				component.onRender();
				yield;
			}
		}
	}
}

function callIteratorAndCacheResult(
	component: Component,
	method: 'onUpdate' | 'onLateUpdate' | 'onFixedUpdate',
	cache:
		| 'cachedUpdateGenerator'
		| 'cachedLateUpdateGenerator'
		| 'cachedFixedUpdateGenerator'
) {
	const componentCachedGenerator: ComponentCachedGenerator = (component as unknown) as ComponentCachedGenerator;
	const cached = componentCachedGenerator[cache];

	if (cached === false) {
		component[method]();
	} else {
		if (cached === undefined) {
			componentCachedGenerator[cache] = component[method]() || false;
		}
		if (cached) {
			const next = cached.next();
			if (next.done === true) {
				componentCachedGenerator[cache] = undefined;
			}
		}
	}
}
