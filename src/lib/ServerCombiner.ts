import { Disposable, CompositeDisposable } from 'konstellio-disposable';

import { Client } from './Client';
import { Server } from './Server';
import { Payload } from './Message';

export class ServerCombiner extends Server {

	protected servers: Server[];
	protected janitor: CompositeDisposable;

	constructor(servers: Server[]) {
		super();

		this.servers = servers;
		this.janitor = new CompositeDisposable();

		this.servers.forEach(server => {
			this.janitor.add(new Disposable(() => server.dispose()));
			this.janitor.add(server.onClose((err) => {
				this.emit('onClose', err);
				this.disposeAsync();
			}));
			this.janitor.add(server.onClientConnect((client) => this.emit('onClientConnect', client)));
			this.janitor.add(server.onClientDisconnect((client) => this.emit('onClientDisconnect', client)));
			this.janitor.add(server.onMessage((client, message) => this.emit('onMessage', client, message)));
		});
	}

	getClients(): Client[] {
		return this.servers.reduce((clients: Client[], server) => {
			return clients.concat(server.getClients());
		}, []);
	}

	broadcastPayload(payload: Payload): void {
		this.servers.forEach(server => server.broadcastPayload(payload));
	}

	disposeAsync(): Promise<void> {
		return this.janitor.disposeAsync().then(super.disposeAsync);
	}

}