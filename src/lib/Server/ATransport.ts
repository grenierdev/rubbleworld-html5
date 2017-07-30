import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, IDisposable } from 'konstellio-disposable';

import { Client } from './Client';

export type CloseEventListener = (error?: Error) => void;
export type ClientConnectEventListener = (client: Client) => void;
export type ClientDisconnectEventListener = (client: Client) => void;
export type MessageReceiveEventListener = (client: Client, message: Message) => void;

export interface Message {
	type: string
	ts: number
}

export interface MessagePayload {
	type: string
	[payload: string]: any;
};

export abstract class ATransport extends EventEmitter {

	protected clients: Map<string, Client>;

	constructor () {
		super();

		this.clients = new Map<string, Client>();
	}

	getClientById (id: string): Client {
		if (this.clients.has(id)) {
			return this.clients.get(id)!;
		}
		throw new ReferenceError(`Unknown client ID ${id}.`);
	}

	getClients (): Client[] {
		return Array.from(this.clients.values());
	}

	onClose (listener: CloseEventListener): Disposable {
		return this.on('onClose', listener);
	}

	onClientConnect (listener: ClientConnectEventListener): Disposable {
		return this.on('onConnect', listener);
	}

	onClientDisconnect (listener: ClientDisconnectEventListener): Disposable {
		return this.on('onDisconnect', listener);
	}

	onMessageReceive (listener: MessageReceiveEventListener): Disposable {
		return this.on('onMessageReceive', listener);
	}

	abstract sendTo (client: Client, payload: MessagePayload): void;
	abstract sendToAll (payload: MessagePayload): void;

}