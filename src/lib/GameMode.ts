import { EventEmitter } from 'konstellio-eventemitter';
import { Disposable } from 'konstellio-disposable';

import { Client } from './Client';
import { Server } from './Server';

export abstract class GameMode extends EventEmitter {

	protected adapter: Client | Server;

	constructor(adapter: Client | Server) {
		super();

		this.adapter = adapter;
	}

	get isClient(): boolean {
		return this.adapter instanceof Client;
	}

	get isServer(): boolean {
		return !this.isClient;
	}

	disposeAsync(): Promise<void> {
		(this as any).adapter = undefined;
		return super.disposeAsync();
	}

}