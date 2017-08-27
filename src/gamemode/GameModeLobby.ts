import { Disposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { GameMode } from './GameMode';
import { Client } from '../net/Client';
import { Server } from '../net/Server';
import { Message } from '../net/Message';

import { Scene, Actor, Entity, Replicated, RPC, Type } from '../net/Scene';

export type ChangeEventListener = () => void;

export class GameModeLobby extends GameMode {

	readonly scene: Scene<PlayerActor>;

	constructor(adapter: Client | Server) {
		super(adapter);

		this.scene = new Scene<PlayerActor>(adapter, PlayerActor);
		this.scene.onSceneChanged(() => this.emit('onChange'));
		this.scene.registerEntity(PickupEntity);
		this.scene.registerEntity(PlayerEntity);

		if (this.isServer) {

			this.scene.spawnEntity('PickupEntity', 'Health pack');

			this.scene.onClientConnect((client, actor) => {
				const entity = this.scene.spawnEntity('PlayerEntity', 'Unannounced', false);
				actor.grantControl(entity.id);
			});
			this.scene.onClientDisconnect((client, actor) => {
				actor.getInControl().forEach(entityId => {
					const entity = this.scene.getEntityById(entityId);
					if (entity) {
						this.scene.removeEntity(entity);
					}
				});
			});
		}
	}

	onChange(listener: ChangeEventListener): Disposable {
		return this.on('onChange', listener);
	}

}

export class PlayerActor extends Actor {
	canSee(entityId: string): boolean {
		return true;
	}
}

export class PlayerEntity extends Entity {

	@Replicated(Type.String)
	name: string;

	@Replicated(Type.Boolean)
	ready: boolean;

	constructor(id: string, name: string, ready: boolean) {
		super(id);

		this.name = name;
		this.ready = !!ready;
	}

	@RPC()
	setReady(ready: boolean): void {
		this.ready = ready;
		this.scene.emit('onSceneChanged');
	}

	@RPC()
	setName(name: string): void {
		this.name = name;
		this.scene.emit('onSceneChanged');
	}
}

export class PickupEntity extends Entity {

	@Replicated(Type.String)
	name: string;

	constructor(id: string, name: string) {
		super(id);

		this.name = name;
	}

}