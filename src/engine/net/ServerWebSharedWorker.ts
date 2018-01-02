import { Client } from './Client';
import { Server } from './Server';
import { Payload } from './Message';

declare var onconnect: (e: MessageEvent) => void;

export class ServerWebSharedWorker extends Server {

	constructor() {
		super();

		onconnect = (e) => {
			const client = new ServerWebSharedWorkerClient(e.ports[0]);
			this.clients.push(client);

			client.onClose((err) => {
				this.clients = [...this.clients.filter(cl => cl !== client)];
				this.emit('onClientDisconnect', client);
			});
			client.onDisconnect(() => {
				this.clients = [...this.clients.filter(cl => cl !== client)];
				this.emit('onClientDisconnect', client);
			});
			client.onMessage((message) => this.emit('onMessage', client, message));

			this.emit('onClientConnect', client);
		};

		// onerror = (e: ErrorEvent) => {
		onerror = (e: any) => {
			this.emit('onClose', e.message);
			this.dispose();
		}
	}

}

export class ServerWebSharedWorkerClient extends Client {

	protected port: MessagePort;

	constructor(port: MessagePort) {
		super();

		this.port = port;
		this.port.addEventListener('error', (e: any) => {
			console.log('SharedWorker.Port had an error', e);
		});
		this.port.addEventListener('message', (e: MessageEvent) => {
			e.stopPropagation();
			if (e.data === 'hack:close') {
				this.emit('onDisconnect');
			} else {
				this.emit('onMessage', { ...e.data });
			}
		});
		this.port.start();
	}

	sendPayload(payload: Payload): void {
		this.port.postMessage({
			ts: Date.now(),
			...payload
		});
	}

	disposeAsync(): Promise<void> {
		// this.port.removeEventListener('message');
		try {
			(this as any).port = undefined;
		} catch (e) { }
		return super.disposeAsync();
	}

}