import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import { Message, Payload } from './Message';

export type CloseEventListener = (error: Error) => void;
export type ConnectEventListener = () => void;
export type DisconnectEventListener = () => void;
export type MessageEventListener = (message: Message) => void;

let nextClientId = 0;

export abstract class Client extends EventEmitter {

	readonly id: string;

	constructor() {
		super();

		this.id = (++nextClientId).toString();
	}

	abstract sendPayload(payload: Payload): void;

	onClose(listener: CloseEventListener): Disposable {
		return this.on('onClose', listener);
	}

	onConnect(listener: ConnectEventListener): Disposable {
		return this.on('onConnect', listener);
	}

	onDisconnect(listener: DisconnectEventListener): Disposable {
		return this.on('onDisconnect', listener);
	}

	onMessage(listener: MessageEventListener): Disposable {
		return this.on('onMessage', listener);
	}

}