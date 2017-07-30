import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable, IDisposable } from 'konstellio-disposable';

export type CloseEventListener = (error?: Error) => void;
export type ClientConnectEventListener = () => void;
export type ClientDisconnectEventListener = () => void;
export type MessageReceiveEventListener = (message: Message) => void;

export interface Message {
	type: string
	ts: number
}

export interface MessagePayload {
	type: string
	[payload: string]: any;
};

export abstract class ATransport extends EventEmitter {

	constructor () {
		super();
	}

	onClose (listener: CloseEventListener): Disposable {
		return this.on('onClose', listener);
	}

	onConnect (listener: ClientConnectEventListener): Disposable {
		return this.on('onConnect', listener);
	}

	onDisconnect (listener: ClientDisconnectEventListener): Disposable {
		return this.on('onDisconnect', listener);
	}

	onMessageReceive (listener: MessageReceiveEventListener): Disposable {
		return this.on('onMessageReceive', listener);
	}

	abstract send (payload: MessagePayload): void;

}