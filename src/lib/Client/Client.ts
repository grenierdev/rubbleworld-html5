import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import {
	ATransport,
	CloseEventListener,
	ClientConnectEventListener,
	ClientDisconnectEventListener,
	MessageReceiveEventListener,
	MessagePayload
} from './ATransport';


export class Client extends EventEmitter {

	protected transport: ATransport;

	constructor (transport: ATransport) {
		super();
		
		this.transport = transport;
	}

	onClose (listener: CloseEventListener): Disposable {
		return this.transport.on('onClose', listener);
	}

	onConnect (listener: ClientConnectEventListener): Disposable {
		return this.transport.on('onConnect', listener);
	}

	onDisconnect (listener: ClientDisconnectEventListener): Disposable {
		return this.transport.on('onDisconnect', listener);
	}

	onMessageReceive (listener: MessageReceiveEventListener): Disposable {
		return this.transport.on('onMessageReceive', listener);
	}

	send (payload: MessagePayload): void {
		this.transport.send(payload);
	}

}