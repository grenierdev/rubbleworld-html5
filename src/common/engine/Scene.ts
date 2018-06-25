export abstract class Component {
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;

	private onUpdateGenerator: IterableIterator<any> | false | undefined;

	constructor() {
		this.enabled = true;
	}

	onMount(): void { }
	onUnmount(): void { }
	onUpdate(): IterableIterator<void> | void { }
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

	getComponent<T extends Component>(type: typeof Component): T | undefined {
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
					component.onMount();
				}
			}
			else if (this.mounted === true && this.parent === undefined) {
				this.mounted = false;

				for (const component of this.components) {
					component.onUnmount();
				}
			}

			for (const component of this.components) {
				if ((component as any).onUpdateGenerator === false) {
					component.onUpdate();
				}
				else {
					if ((component as any).onUpdateGenerator === undefined) {
						(component as any).onUpdateGenerator = component.onUpdate() || false;
					}

					if ((component as any).onUpdateGenerator) {
						const next = (component as any).onUpdateGenerator.next() as IteratorResult<void>;
						if (next.done === true) {
							(component as any).onUpdateGenerator = undefined;
						}
					}
				}
				yield;
			}

			for (const child of this.children) {
				yield* child.update();
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