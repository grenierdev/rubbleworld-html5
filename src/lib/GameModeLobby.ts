import * as Immutable from 'immutable';

import { GameMode } from './GameMode';
import { Client } from './Client';
import { Server } from './Server';
import { Message } from './Message';

export class GameModeLobby extends GameMode {

	protected state: Immutable.Map<string, any>

	constructor(adapter: Client | Server) {
		super(adapter);

		this.state = Immutable.Map({
			clientPlayerId: 0,
			players: Immutable.Map()
		});

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
		return {
			clientPlayerId: this.state.get('clientPlayerId'),
			players: Object.values(this.state.get('players').toJS())
		};
	}

	protected nextPlayerId = 0;

	protected onServerAction(action: Message, client: LobbyClient): void {
		const server = this.adapter as Server;

		if (action.type === 'CONNECTED') {
			const player: LobbyPlayer = {
				id: (++this.nextPlayerId).toString(),
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

		else if (action.type === 'NAME') {
			this.onAction({ type: 'NAME', ts: action.ts, playerId: client!.player.id, name: action.name });
			server.broadcastAllPayload({ type: 'NAME', playerId: client!.player.id, name: action.name });
		}

		else if (action.type === 'READY') {
			this.onAction({ type: 'READY', ts: action.ts, playerId: client!.player.id, ready: action.ready });
			server.broadcastAllPayload({ type: 'READY', playerId: client!.player.id, ready: action.ready });
		}

		else if (action.type === 'MSG') {
			server.broadcastAllPayload({ type: 'MSG', playerId: client!.player.id, body: action.body });
		}
	}

	protected onAction(action: Message): void {
		if (action.type === 'STATE') {
			this.state = this.state.withMutations(state => {
				const players = Immutable.Map<string, any>().asMutable();
				action.players.forEach((player: LobbyPlayer) => players.set(player.id, Immutable.Map(player)));
				state.set('players', players.asImmutable());
				state.set('clientPlayerId', action.clientPlayerId);
			});
		}

		else if (action.type === 'JOIN') {
			this.state = this.state.setIn(['players', action.player.id], Immutable.Map(action.player));
		}

		else if (action.type === 'LEFT') {
			this.state = this.state.deleteIn(['players', action.playerId]);
		}

		else if (action.type === 'NAME') {
			this.state = this.state.setIn(['players', action.playerId, 'name'], action.name);
		}

		else if (action.type === 'READY') {
			this.state = this.state.setIn(['players', action.playerId, 'ready'], !!action.ready);
		}

		else if (action.type === 'MSG') {
			console.log('MSG', action);
		}
	}

}

export interface LobbyClient extends Client {
	player: LobbyPlayer
}

export interface LobbyPlayer {
	id: string,
	name: string,
	ready: boolean
}