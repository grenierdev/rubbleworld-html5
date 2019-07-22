import { EventEmitter } from '@konstellio/eventemitter';
import { Disposable, CompositeDisposable } from '@konstellio/disposable';
import { Payload } from './Payload';

export class Server extends EventEmitter {
	public readonly clients: ReadonlySet<ServerClient> = new Set();

	private readonly janitor: CompositeDisposable = new CompositeDisposable();

	constructor(public readonly transports: ReadonlyArray<ServerTransport>) {
		super();

		for (const transport of transports) {
			this.janitor.add(
				transport.onConnect(client => {
					(this.clients as Set<ServerClient>).add(client);
					this.janitor.add(
						client.onDisconnect(() => {
							this.emit('onClientLeave', client);
							(this.clients as Set<ServerClient>).delete(client);
						})
					);
					this.janitor.add(
						client.onReceive(payload => {
							this.emit('onReceive', client, payload);
						})
					);
					this.emit('onClientJoin', client);
				})
			);
		}
	}

	dispose() {
		super.dispose();
		this.janitor.dispose();
	}

	broadcast(payload: Payload) {
		for (const client of this.clients) {
			client.send(payload);
		}
	}

	broadcastExcept(payload: Payload, ...exceptions: ServerClient[]) {
		for (const client of this.clients) {
			if (exceptions.indexOf(client) === -1) {
				client.send(payload);
			}
		}
	}

	onClientJoin(listener: (client: ServerClient) => void) {
		return this.on('onClientJoin', listener);
	}

	onClientLeave(listener: (client: ServerClient) => void) {
		return this.on('onClientLeave', listener);
	}

	onReceive(listener: (client: ServerClient, payload: Payload) => void) {
		return this.on('onReceive', listener);
	}
}

export abstract class ServerTransport extends EventEmitter {
	onReady(listener: () => void): Disposable {
		return this.on('onReady', listener);
	}
	onClose(listener: () => void): Disposable {
		return this.on('onClose', listener);
	}
	onConnect(listener: (client: ServerClient) => void): Disposable {
		return this.on('onConnect', listener);
	}
}

export abstract class ServerClient extends EventEmitter {
	abstract send(payload: Payload): void;

	onReceive(listener: (payload: Payload) => void): Disposable {
		return this.on('onReceive', listener);
	}
	onDisconnect(listener: () => void): Disposable {
		return this.on('onDisconnect', listener);
	}
}
