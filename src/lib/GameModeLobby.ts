import * as Immutable from 'immutable';

import { GameMode } from './GameMode';
import { Client } from './Client';
import { Server } from './Server';
import { Message } from './Message';

export class GameModeLobby extends GameMode {

	protected state: Immutable.Map<string, any>

	constructor(adapter: Client | Server) {
		super(adapter);

		this.state = Immutable.Map();

		if (this.isServer) {
			const server: Server = this.adapter as Server;

			server.onClientConnect((client) => this.onServerAction({ type: 'CONNECTED', ts: Date.now() }, client as LobbyClient));
			server.onClientDisconnect((client) => this.onServerAction({ type: 'DISCONNECTED', ts: Date.now() }, client as LobbyClient));
			server.onMessage((client, message) => this.onServerAction(message, client as LobbyClient));
		}

		else {
			const client: Client = this.adapter as Client;

			client.onMessage((message) => this.onAction(message));
		}
	}

	getState (): any {
		return this.state.toJS();
	}

	onServerAction(action: Message, client: LobbyClient): void {
		const server = this.adapter as Server;

		if (action.type === 'CONNECTED') {
			const player: LobbyPlayer = {
				id: (++nextPlayerId).toString(),
				name: '',
				ready: false
			};
			client.player = player;

			this.onAction({ type: 'JOIN', ts: action.ts, player: player });
			server.broadcastExceptPayload([client], { type: 'JOIN', player: player });
			client.sendPayload({
				type: 'STATE',
				...this.getState(),
				clientPlayerId: player.id
			});
		}

		else if (action.type === 'DISCONNECTED') {
			this.onAction({ type: 'LEFT', ts: action.ts, playerId: client!.player.id });
			server.broadcastAllPayload({ type: 'LEFT', playerId: client!.player.id });
		}

		else if (action.type === 'MSG') {
			server.broadcastAllPayload({ type: 'MSG', playerId: client!.player.id, body: action.body });
		}
	}

	onAction(action: Message): void {
		if (action.type === 'STATE') {
			this.state = this.state.withMutations(state => {
				state.set('clientPlayerId', action.clientPlayerId);
				const players = Immutable.Map<string, any>().asMutable();
				action.players.forEach((player: LobbyPlayer) => players.set(player.id, Immutable.Map(player)));
				state.set('players', players);
			});
		}

		else if (action.type === 'JOIN') {
			this.state = this.state.update('players', (players) => players.set(action.player.id, Immutable.Map(action.player)));
		}

		else if (action.type === 'LEFT') {
			this.state = this.state.deleteIn(['players', action.playerId]);
		}

		else if (action.type === 'MSG') {
			console.log('MSG', action);
		}
	}

}

let nextPlayerId = 0;

export interface LobbyClient extends Client {
	player: LobbyPlayer
}

export interface LobbyPlayer {
	id: string,
	name: string,
	ready: boolean
}