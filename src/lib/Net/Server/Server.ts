import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import {
	ATransport,
	CloseEventListener,
	ClientConnectEventListener,
	ClientDisconnectEventListener,
	MessageReceiveEventListener
} from './Transport/ATransport';

import { MessagePayload } from '../Message';
import { Client } from './Client';


export class Server extends EventEmitter {

	protected transport: ATransport;

	constructor (transport: ATransport) {
		super();
		
		this.transport = transport;
	}

	getClientById (id: string): Client {
		return this.transport.getClientById(id);
	}

	getClients (): Client[] {
		return this.transport.getClients();
	}

	onClose (listener: CloseEventListener): Disposable {
		return this.transport.on('onClose', listener);
	}

	onClientConnect (listener: ClientConnectEventListener): Disposable {
		return this.transport.on('onConnect', listener);
	}

	onClientDisconnect (listener: ClientDisconnectEventListener): Disposable {
		return this.transport.on('onDisconnect', listener);
	}

	onMessageReceive (listener: MessageReceiveEventListener): Disposable {
		return this.transport.on('onMessageReceive', listener);
	}

	sendTo (client: Client, payload: MessagePayload): void {
		this.transport.sendTo(client, payload);
	}

	sendToAll (payload: MessagePayload): void {
		this.transport.sendToAll(payload);
	}

}