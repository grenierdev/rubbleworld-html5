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
				this.emit('onClientDisconnect', client);
				this.emit('onClose', new Error(`WebWorker got an error : ${err.message}.`));
				this.dispose();
			});
			client.onMessage((message) => this.emit('onMessage', client, message));

			this.emit('onClientConnect', client)
		};

		onerror = (e: ErrorEvent) => {
			this.emit('onClose', e.message);
			this.dispose();
		}

		console.log('ServerWebSharedWorker');
	}

}

export class ServerWebSharedWorkerClient extends Client {

	protected port: MessagePort;

	constructor(port: MessagePort) {
		super();

		this.port = port;
		this.port.addEventListener('message', (e: MessageEvent) => {
			this.emit('onMessage', { ...e.data });
		});
		this.port.start();
	}

	sendPayload(payload: Payload): void {
		this.port.postMessage({
			ts: Date.now(),
			...payload
		});
	}

}