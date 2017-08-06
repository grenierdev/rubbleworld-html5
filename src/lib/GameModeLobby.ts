import { GameMode } from './GameMode';
import { Client } from './Client';
import { Server } from './Server';
import { Message } from './Message';

export class GameModeLobby extends GameMode {

	protected players: Map<string, LobbyPlayer>;
	protected clientPlayerId: string;

	constructor(adapter: Client | Server) {
		super(adapter);

		this.players = new Map<string, LobbyPlayer>();
		this.clientPlayerId = '';

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
			players: Array.from(this.players.values()),
			clientPlayerId: this.clientPlayerId
		};
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
			this.clientPlayerId = action.clientPlayerId;
			this.players = new Map<string, LobbyPlayer>();
			action.players.forEach((player: LobbyPlayer) => this.players.set(player.id, player));
		}

		else if (action.type === 'JOIN') {
			this.players.set(action.player.id, action.player);
		}

		else if (action.type === 'LEFT') {
			this.players.delete(action.playerId);
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