import { CompositeDisposable, Disposable } from 'konstellio-disposable';

import { AGameMode } from './AGameMode';
import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';
import { Client as ServerClient } from '../Net/Server/Client';
import { Message, MessagePayload } from '../Net/Message';

export type Player = {
	id: string,
	clientId?: string,
	name: string
};

export type PlayerJoinedEventListener = (player: Player) => void;
export type PlayerLeftEventListener = (player: Player) => void;

interface PayloadHello extends Message {
	type: string,
	playerId: string
}

interface PayloadIAM extends Message {
	type: string,
	name: string
}

interface PayloadJoined extends Message {
	type: string,
	playerId: string,
	name: string
}

interface PayloadLeft extends Message {
	type: string,
	playerId: string
}

export class GameModeLobby extends AGameMode {

	protected players: Map<string, Player>;
	protected janitor: CompositeDisposable;

	private nextId: number = 0;

	constructor (netAdapter: Client | Server) {
		super(netAdapter);

		this.janitor = new CompositeDisposable();
		this.players = new Map<string, Player>();

		if (this.isServer) {
			const server: Server = this.netAdapter as Server;

			const onClientConnected = (client: ServerClient) => {
				const player: Player = {
					id: (++this.nextId).toString(),
					clientId: client.id,
					name: 'Unannounced'
				};
				this.players.set(player.id, player);
				server.sendTo(client, { type: 'HELLO', playerId: player.id } as PayloadHello);
			}

			this.janitor.add(server.onClientConnect(onClientConnected));
			this.janitor.add(server.onClientDisconnect((client) => {
				try {
					let player: Player = this.getPlayerByClientId(client.id);
					this.emit('onPlayerLeft', player);
					server.sendToAll({ type: 'PLAYERLEFT', playerId: player.id });
				} catch (e) {

				}
			}));
			this.janitor.add(server.onMessageReceive((client, message) => {
				if (message.type === 'IAM') {
					let payload: PayloadIAM = message as PayloadIAM;
					let player: Player = this.getPlayerByClientId(client.id);
					player.name = payload.name;

					this.emit('onPlayerJoined', player);

					server.sendToAll({ type: 'PLAYERJOINED', playerId: player.id, name: player.name });
					this.players.forEach((otherPlayer) => {
						if (otherPlayer.id != player.id) {
							server.sendTo(client, { type: 'PLAYERJOINED', playerId: player.id, name: player.name });
						}
					});
				}
			}));

			server.getClients().forEach(onClientConnected);
		}

		else {
			const client: Client = this.netAdapter as Client;
			this.janitor.add(client.onMessageReceive((message) => {
				if (message.type === 'HELLO') {
					let payload: PayloadHello = message as PayloadHello;
					let name: string = 'Player';
					client.send({ type: 'IAM', name: name });
				}
				else if (message.type === 'PLAYERJOINED') {
					let payload: PayloadJoined = message as PayloadJoined;
					let player: Player = { id: payload.playerId, name: payload.name };
					this.players.set(player.id, player);
					this.emit('onPlayerJoined', player);
				}
				else if (message.type === 'PLAYERLEFT') {
					let payload: PayloadLeft = message as PayloadLeft;
					let player: Player = this.getPlayerById(payload.playerId);
					this.emit('onPlayerLeft', player);
					this.players.delete(player.id);
				}
			}));
		}
	}

	getPlayerById (playerId): Player {
		let result: Player | undefined = this.players.get(playerId);

		if (result === undefined) {
			throw new ReferenceError(`Unknown player ID ${playerId}.`);
		}
		return result;
	}

	getPlayerByClientId (clientId): Player {
		let result: Player | undefined;
		this.players.forEach((player) => {
			if (player.clientId == clientId) {
				result = player;
			}
		});

		if (result === undefined) {
			throw new ReferenceError(`Unknown client ID ${clientId}.`);
		}
		return result;
	}

	disposeAsync (): Promise<void> {
		return this.janitor.disposeAsync().then(super.disposeAsync);
	}

	onPlayerJoined (listener: PlayerJoinedEventListener): Disposable {
		return this.on('onPlayerJoined', listener);
	}
	
	onPlayerLeft (listener: PlayerLeftEventListener): Disposable {
		return this.on('onPlayerLeft', listener);
	}
}