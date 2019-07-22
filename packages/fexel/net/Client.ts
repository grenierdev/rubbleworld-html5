import { EventEmitter } from '@konstellio/eventemitter';
import { Disposable, CompositeDisposable } from '@konstellio/disposable';
import { Payload } from './Payload';

export class Client extends EventEmitter {
	private readonly janitor: CompositeDisposable = new CompositeDisposable();

	constructor(public readonly transport: ClientTransport) {
		super();

		this.janitor.add(transport.onConnect(() => this.emit('onConnect')));
		this.janitor.add(transport.onDisconnect(() => this.emit('onDisconnect')));
		this.janitor.add(transport.onReceive(() => this.emit('onReceive')));
	}

	dispose() {
		super.dispose();
		this.janitor.dispose();
	}

	send(payload: Payload) {
		return this.transport.send(payload);
	}

	onConnect(listener: () => void): Disposable {
		return this.on('onConnect', listener);
	}

	onDisconnect(listener: () => void): Disposable {
		return this.on('onDisconnect', listener);
	}

	onReceive(listener: (payload: Payload) => void): Disposable {
		return this.on('onReceive', listener);
	}
}

export abstract class ClientTransport extends EventEmitter {
	abstract send(payload: Payload): void;

	onConnect(listener: () => void): Disposable {
		return this.on('onConnect', listener);
	}
	onDisconnect(listener: () => void): Disposable {
		return this.on('onDisconnect', listener);
	}
	onReceive(listener: (payload: Payload) => void): Disposable {
		return this.on('onReceive', listener);
	}
}
