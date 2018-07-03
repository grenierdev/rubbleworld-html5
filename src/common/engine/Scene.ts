export abstract class Component {
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;

	private cachedUpdateGenerator: IterableIterator<any> | false | undefined;
	private cachedLateUpdateGenerator: IterableIterator<any> | false | undefined;

	constructor() {
		this.enabled = true;
	}

	getComponent<T extends Component>(type: any): T | undefined {
		if (this.entity) {
			return this.entity.getComponent(type);
		}
		return undefined;
	}

	onStart(): void { }
	onStop(): void { }
	onUpdate(): IterableIterator<void> | void { }
	onLateUpdate(): IterableIterator<void> | void { }
	onRender(): void { }
}

export class Entity {

	public readonly parent: undefined | Entity;
	public readonly enabled: boolean;

	private mounted: boolean;

	private children: Entity[];
	private components: Component[];

	constructor(
		components: Component[] = [],
		children: Entity[] = []
	) {
		this.enabled = true;
		this.mounted = false;
		this.children = [];
		this.components = [];

		for (const component of components) {
			this.addComponent(component);
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
			(entity as any).mounted = false;
			for (const component of entity.components) {
				component.onStop();
			}
		}
	}

	addComponent(component: Component) {
		if (this.components.indexOf(component) === -1) {
			this.components.push(component);
			(component as any).entity = this;
		}
	}

	removeComponent(component: Component) {
		const idx = this.components.indexOf(component);
		if (idx > -1) {
			this.components.splice(idx, 1);
			(component as any).entity = undefined;
		}
	}

	getComponent<T extends Component>(type: any): T | undefined {
		const component = this.components.find(component => component.constructor === type);
		if (component) {
			return component as T;
		}
	}

	*update(): IterableIterator<void> {
		if (this.enabled) {
			if (this.mounted === false && this.parent) {
				this.mounted = true;

				for (const component of this.components) {
					component.onStart();
				}
			}

			for (const component of this.components) {
				if ((component as any).cachedUpdateGenerator === false) {
					component.onUpdate();
				}
				else {
					if ((component as any).cachedUpdateGenerator === undefined) {
						(component as any).cachedUpdateGenerator = component.onUpdate() || false;
					}

					if ((component as any).cachedUpdateGenerator) {
						const next = (component as any).cachedUpdateGenerator.next() as IteratorResult<void>;
						if (next.done === true) {
							(component as any).cachedUpdateGenerator = undefined;
						}
					}
				}
				yield;
			}

			for (const child of this.children) {
				yield* child.update();
			}

			for (const component of this.components) {
				if ((component as any).cachedLateUpdateGenerator === false) {
					component.onLateUpdate();
				}
				else {
					if ((component as any).cachedLateUpdateGenerator === undefined) {
						(component as any).cachedLateUpdateGenerator = component.onLateUpdate() || false;
					}

					if ((component as any).cachedLateUpdateGenerator) {
						const next = (component as any).cachedLateUpdateGenerator.next() as IteratorResult<void>;
						if (next.done === true) {
							(component as any).cachedLateUpdateGenerator = undefined;
						}
					}
				}
				yield;
			}
		}
	}
}

export class Scene extends Entity {
	constructor(
		children: Entity[] = []
	) {
		super([], children);
	}
}