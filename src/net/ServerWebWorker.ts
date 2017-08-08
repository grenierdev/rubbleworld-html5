import { Client } from './Client';
import { Server } from './Server';
import { Payload } from './Message';

export class ServerWebWorker extends Server {

	constructor() {
		super();

		const client = new ServerWebWorkerClient();
		this.clients.push(client);

		client.onClose((err) => {
			this.emit('onClientDisconnect', client);
			this.emit('onClose', new Error(`WebWorker got an error : ${err.message}.`));
			this.dispose();
		});
		client.onMessage((message) => this.emit('onMessage', client, message));

		setTimeout(() => this.emit('onClientConnect', client));
	}

}

export class ServerWebWorkerClient extends Client {

	constructor() {
		super();

		// onerror = (e: ErrorEvent) => {
		onerror = (e: any) => {
			this.emit('onClose', e.message);
			this.dispose();
		}

		onmessage = (e: MessageEvent) => {
			this.emit('onMessage', { ...e.data });
		}
	}

	sendPayload(payload: Payload): void {
		postMessage({
			ts: Date.now(),
			...payload
		});
	}

}