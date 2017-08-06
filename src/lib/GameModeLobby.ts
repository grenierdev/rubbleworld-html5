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

			server.onClientConnect((client) => this.onAction({ type: 'CL_CONNECTED', ts: Date.now() }, client as LobbyClient));
			server.onClientDisconnect((client) => this.onAction({ type: 'CL_DISCONNECTED', ts: Date.now() }, client as LobbyClient));
			server.onMessage((client, message) => this.onAction({ ...message, type: `CL_${message.type}` }, client as LobbyClient));
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

	onAction(action: Message, from?: LobbyClient): void {
		const server = this.adapter as Server;

		if (action.type === 'CL_CONNECTED' && from) {
			const player: LobbyPlayer = {
				id: (++nextPlayerId).toString(),
				name: '',
				ready: false,
				color: ''
			};
			from.player = player;

			this.players.set(player.id, player);
			from.sendPayload({
				type: 'STATE',
				...this.getState(),
				clientPlayerId: player.id
			});
			server.broadcastExceptPayload([from], { type: 'JOIN', player: player });
		}

		else if (action.type === 'CL_DISCONNECTED' && from) {
			server.broadcastAllPayload({ type: 'LEFT', playerId: from!.player.id });
			this.players.delete(from!.player.id);
		}

		else if (action.type === 'STATE') {
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

		else if (action.type === 'CL_MSG') {
			server.broadcastAllPayload({ type: 'MSG', playerId: from!.player.id, body: action.body });
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
	ready: boolean,
	color: string
}