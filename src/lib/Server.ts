import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import { Payload } from './Message';
import { Client } from './Client';
import { Message } from './Message';

export type CloseEventListener = (error: Error) => void;
export type ClientConnectEventListener = (client: Client) => void;
export type ClientDisconnectEventListener = (client: Client) => void;
export type ReceiveEventListener = (client: Client, message: Message) => void;

export abstract class Server extends EventEmitter {

	protected clients: Client[];

	constructor() {
		super();

		this.clients = [];
	}

	getClients(): Client[] {
		return this.clients.concat();
	}

	broadcastPayload(payload: Payload): void {
		this.clients.forEach(client => client.sendPayload(payload));
	}

	onClose(listener: CloseEventListener): Disposable {
		return this.on('onClose', listener);
	}

	onClientConnect(listener: ClientConnectEventListener): Disposable {
		return this.on('onClientConnect', listener);
	}

	onClientDisconnect(listener: ClientDisconnectEventListener): Disposable {
		return this.on('onClientDisconnect', listener);
	}

	onMessage(listener: ReceiveEventListener): Disposable {
		return this.on('onMessage ', listener);
	}

}