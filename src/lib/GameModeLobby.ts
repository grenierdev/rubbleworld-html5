import { GameMode } from './GameMode';
import { Client } from './Client';
import { Server } from './Server';

let nextPlayerId = 0;

export class Player {
	readonly id: string;
	public name: string;
	public ready: boolean;
	public client?: Client;

	constructor() {
		this.id = (++nextPlayerId).toString();
		this.name = '';
		this.ready = false;
		this.client = undefined;
	}
}

export class GameModeLobby extends GameMode {

	protected players: Player[];
	protected playerClients: Map<Client, Player>;

	constructor(adapter: Client | Server) {
		super(adapter);

		this.players = [];
		this.playerClients = new Map<Client, Player>();

		if (this.isServer) {
			const server: Server = this.adapter as Server;

			server.onClientConnect((client) => {
				const player = new Player();
				player.client = client;
				this.playerClients.set(client, player);

				this.players.push(player);
				server.broadcastPayload({ type: 'JOIN', id: player.id, name: player.name, ready: false });
			});

			server.onMessage((from, message: any) => {
				if (message.type === 'CHAT') {
					server.broadcastPayload({ type: 'CHAT', body: message.body });
				}
			});
		}

		else {
			const client: Client = this.adapter as Client;

			client.onMessage((message) => {
				console.log(message);
			})
		}
	}

}