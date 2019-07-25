import { ServerTransport, ServerClient } from './Server';
import { ClientTransport } from './Client';
import { CompositeDisposable, Disposable } from '@konstellio/disposable';
import { Payload } from './Payload';

export class RelayServerTransport extends ServerTransport {
	protected readonly janitor = new CompositeDisposable([]);

	constructor(protected readonly transport: ServerTransport) {
		super();

		this.janitor.add(transport.onReady(() => this.emit('onReady')));
		this.janitor.add(transport.onClose(() => this.emit('onClose')));
		this.janitor.add(
			transport.onConnect(client => {
				const relayClient = new RelayServerClient(this, client);
				this.emit('onConnect', relayClient);
			})
		);
	}

	dispose() {
		super.dispose();
		this.janitor.dispose();
	}
}

export class RelayServerClient extends ServerClient {
	protected readonly janitor = new CompositeDisposable([]);
	protected readonly relayClients: Map<string, RelayServerClientSubclient> = new Map();

	constructor(protected readonly transport: RelayServerTransport, protected readonly client: ServerClient) {
		super();

		this.janitor.add(client.onDisconnect(() => this.emit('onDisconnect')));
		this.janitor.add(
			client.onReceive(payload => {
				if (payload.type === 'relay') {
					if (payload.event === 'onConnect') {
						const subclient = new RelayServerClientSubclient(payload.client, client);
						this.relayClients.set(payload.client, subclient);
						this.transport.emit('onConnect', subclient);
					} else {
						const subclient = this.relayClients.get(payload.client);
						if (!subclient) {
							throw new Error(`Known subclient #${payload.client}.`);
						}
						subclient.process(payload);
					}
				} else {
					this.emit('onReceive', payload);
				}
			})
		);
	}

	dispose() {
		super.dispose();
		this.janitor.dispose();
	}

	send(payload: Payload) {
		this.client.send(payload);
	}
}

export class RelayServerClientSubclient extends ServerClient {
	constructor(public readonly id: string, protected readonly client: ServerClient) {
		super();
	}

	process(payload: Payload) {
		if (payload.event === 'onDisconnect') {
			this.emit('onDisconnect');
		} else if (payload.event === 'send') {
			this.emit('onReceive', payload.payload);
		}
	}

	send(payload: Payload) {
		this.client.send({ type: 'relay', client: this.id, event: 'send', payload });
	}
}

export class RelayClientTransport extends ClientTransport {
	protected readonly janitor = new CompositeDisposable([]);
	protected readonly relayClients: Map<string, ServerClient> = new Map();
	protected nextClientId = 0;

	constructor(protected readonly server: ServerTransport, protected readonly client: ClientTransport) {
		super();

		this.janitor.add(client.onConnect(() => this.emit('onConnect')));
		this.janitor.add(client.onDisconnect(() => this.emit('onDisconnect')));
		this.janitor.add(
			client.onReceive(payload => {
				if (payload.type === 'relay') {
					const relayClient = this.relayClients.get(payload.client);
					if (!relayClient) {
						throw new Error(`Known relayClient #${payload.client}.`);
					}
					relayClient.send(payload.payload);
				} else {
					this.emit('onReceive', payload);
				}
			})
		);

		this.janitor.add(
			server.onConnect(client => {
				const id = `${++this.nextClientId}`;
				const janitor = new CompositeDisposable([]);
				this.relayClients.set(id, client);

				janitor.add(new Disposable(() => this.relayClients.delete(id)));
				janitor.add(
					client.onDisconnect(() => {
						this.client.send({ type: 'relay', client: id, event: 'onDisconnect' });
						janitor.dispose();
					})
				);
				janitor.add(
					client.onReceive(payload => {
						this.client.send({ type: 'relay', client: id, event: 'send', payload });
					})
				);
				this.client.send({ type: 'relay', client: id, event: 'onConnect' });
			})
		);
	}

	dispose() {
		super.dispose();
		this.janitor.dispose();
	}

	send(payload: Payload) {
		this.client.send(payload);
	}
}
