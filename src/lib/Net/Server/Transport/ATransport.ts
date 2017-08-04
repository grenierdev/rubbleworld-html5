import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, IDisposable } from 'konstellio-disposable';

import { ClientInterface } from '../ClientInterface';
import { Message, MessagePayload } from '../../Message';

export type CloseEventListener = (error?: Error) => void;
export type ClientConnectEventListener = (client: ClientInterface) => void;
export type ClientDisconnectEventListener = (client: ClientInterface) => void;
export type MessageReceiveEventListener = (client: ClientInterface, message: Message) => void;

export abstract class ATransport extends EventEmitter {

	protected clients: ClientInterface[];

	constructor () {
		super();

		this.clients = [];
	}

	abstract sendTo (client: ClientInterface, payload: MessagePayload): void;
	abstract sendToAll (payload: MessagePayload): void;

	getClients (): ClientInterface[] {
		return this.clients.concat();
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
}