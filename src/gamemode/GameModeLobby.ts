import { Disposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';

import { GameMode } from './GameMode';
import { Client } from '../net/Client';
import { Server } from '../net/Server';
import { Message } from '../net/Message';

import { Scene, Actor, Entity, Replicated, RPC, Type } from '../net/Scene';

export type ChangeEventListener = () => void;

export class GameModeLobby extends GameMode {

	readonly scene: Scene;

	constructor(adapter: Client | Server) {
		super(adapter);

		this.scene = new Scene(adapter);
		this.scene.registerActor(PlayerActor);
		this.scene.registerEntity(PlayerEntity);

		this.scene.onClientConnect((client) => {
			const actor = this.scene.spawnActor('PlayerActor', client);
			const entity = this.scene.spawnEntity('PlayerEntity', 'Unannounced', false);
			actor.grantControl(entity.id);
		});
		this.scene.onClientDisconnect((client) => {
			if (client.actor) {
				client.actor.getInControl().forEach(entity => this.scene.removeEntity(entity));
			}
		});
		this.scene.onSceneChanged(() => this.emit('onChange'));
	}

	onChange(listener: ChangeEventListener): Disposable {
		return this.on('onChange', listener);
	}

}

export class PlayerActor extends Actor {
	canSee(entity: Entity): boolean {
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