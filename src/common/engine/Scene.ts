export abstract class Behaviour {
	public readonly entity: undefined | Entity;
	public readonly enabled: boolean;

	private cachedUpdateGenerator: IterableIterator<any> | false | undefined;
	private cachedLateUpdateGenerator: IterableIterator<any> | false | undefined;

	constructor() {
		this.enabled = true;
	}

	getBehaviour<T extends Behaviour>(type: any): T | undefined {
		if (this.entity) {
			return this.entity.getBehaviour(type);
		}
		return undefined;
	}

	onStart(): void {}
	onStop(): void {}
	onUpdate(): IterableIterator<void> | void {}
	onLateUpdate(): IterableIterator<void> | void {}
	onRender(): void {}
}

export class Entity {
	public readonly parent: undefined | Entity;
	public readonly enabled: boolean;

	private mounted: boolean;

	private children: Entity[];
	private behaviours: Behaviour[];

	constructor(behaviours: Behaviour[] = [], children: Entity[] = []) {
		this.enabled = true;
		this.mounted = false;
		this.children = [];
		this.behaviours = [];

		for (const behaviour of behaviours) {
			this.addBehaviour(behaviour);
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
			for (const behaviour of entity.behaviours) {
				behaviour.onStop();
			}
		}
	}

	addBehaviour(behaviour: Behaviour) {
		if (this.behaviours.indexOf(behaviour) === -1) {
			this.behaviours.push(behaviour);
			(behaviour as any).entity = this;
		}
	}

	removeBehaviour(behaviour: Behaviour) {
		const idx = this.behaviours.indexOf(behaviour);
		if (idx > -1) {
			this.behaviours.splice(idx, 1);
			(behaviour as any).entity = undefined;
		}
	}

	getBehaviour<T extends Behaviour>(type: any): T | undefined {
		const behaviour = this.behaviours.find(
			behaviour => behaviour.constructor === type
		);
		if (behaviour) {
			return behaviour as T;
		}
	}

	*update(): IterableIterator<void> {
		if (this.enabled) {
			if (this.mounted === false && this.parent) {
				this.mounted = true;

				for (const behaviour of this.behaviours) {
					behaviour.onStart();
				}
			}

			for (const behaviour of this.behaviours) {
				if ((behaviour as any).cachedUpdateGenerator === false) {
					behaviour.onUpdate();
				} else {
					if ((behaviour as any).cachedUpdateGenerator === undefined) {
						(behaviour as any).cachedUpdateGenerator =
							behaviour.onUpdate() || false;
					}

					if ((behaviour as any).cachedUpdateGenerator) {
						const next = (behaviour as any).cachedUpdateGenerator.next() as IteratorResult<
							void
						>;
						if (next.done === true) {
							(behaviour as any).cachedUpdateGenerator = undefined;
						}
					}
				}
				yield;
			}

			for (const child of this.children) {
				yield* child.update();
			}

			for (const behaviour of this.behaviours) {
				if ((behaviour as any).cachedLateUpdateGenerator === false) {
					behaviour.onLateUpdate();
				} else {
					if ((behaviour as any).cachedLateUpdateGenerator === undefined) {
						(behaviour as any).cachedLateUpdateGenerator =
							behaviour.onLateUpdate() || false;
					}

					if ((behaviour as any).cachedLateUpdateGenerator) {
						const next = (behaviour as any).cachedLateUpdateGenerator.next() as IteratorResult<
							void
						>;
						if (next.done === true) {
							(behaviour as any).cachedLateUpdateGenerator = undefined;
						}
					}
				}
				yield;
			}
		}
	}
}

export class Scene extends Entity {
	constructor(children: Entity[] = []) {
		super([], children);
	}
}
