import { Disposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { GameMode } from './GameMode';
import { Client } from '../net/Client';
import { Server } from '../net/Server';
import { Message } from '../net/Message';

// export type ChangeEventListener = (state: Immutable.Map<string, any>, action: Message) => void;

export class GameModeLobby extends GameMode {


	protected entities: Immutable.List<any>;

	constructor(adapter: Client | Server) {
		super(adapter);

		this.entities = Immutable.List<any>([]);
	}

}

export abstract class FieldOfView {
	abstract isEntityVisibleTo(source: Entity, target: Entity): boolean;
}

export class GodFOV extends FieldOfView {
	isEntityVisibleTo(source: Entity, target: Entity): boolean {
		return true;
	}
}

export class BlindFOV extends FieldOfView {
	isEntityVisibleTo(source: Entity, target: Entity): boolean {
		return false;
	}
}
const blindFOV = new BlindFOV();


interface SimpleGridEntity {
	viewDistance: number
	gridIndex: number
}

export class SimpleGridFOV extends FieldOfView {

	protected width: number;
	protected height: number;
	// protected grid: (Entity | undefined)[];
	protected entities: Map<Entity, SimpleGridEntity>;

	constructor(w: number, h: number) {
		super();

		this.width = w;
		this.height = h;
		// this.grid = new Array(w * h);
		this.entities = new Map<Entity, SimpleGridEntity>();
	}

	addEntity(entity: Entity, x: number, y: number, viewDistance: number): void {
		const idx = this.posToIndex(x, y);
		// this.grid[idx] = entity;
		this.entities.set(entity, { viewDistance, gridIndex: idx });
	}

	isEntityVisibleTo(source: Entity, target: Entity): boolean {
		if (this.entities.has(source) === false) {
			return false;
		}
		if (this.entities.has(target) === false) {
			return false;
		}
		const sourceEntity = this.entities.get(source)!;
		const targetEntity = this.entities.get(target)!;

		const sourcePos = this.indexToPos(sourceEntity.gridIndex);
		const targetPos = this.indexToPos(targetEntity.gridIndex);

		return Math.abs(sourcePos.x - targetPos.x) + Math.abs(sourcePos.y - targetPos.y) <= sourceEntity.viewDistance;
	}

	protected posToIndex (x: number, y: number): number {
		return x + (y * this.width);
	}

	protected indexToPos(idx: number): {x: number, y: number} {
		return {
			x: idx % this.width,
			y: Math.ceil(idx / this.width)
		};
	}
}

export abstract class Entity {

	constructor () {
	}
}