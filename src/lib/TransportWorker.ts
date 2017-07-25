import Transport from './Transport';
import { Disposable, CompositeDisposable } from 'konstellio-disposable';

export default class TransportWorker extends Transport {

	private isClosed: boolean;

	constructor () {
		super();

		this.isClosed = false;

		onmessage = this.onMessage;
		onerror = this.onError;
	}

	isDisposed () {
		return this.isClosed;
	}

	disposeAsync () {
		this.isClosed = true;
		close();
		return Promise.resolve();
	}

	private onMessage (): void {

	}

	private onError (): void {

	}

	send (): void {
		this.emit('msg');
	}

	receive (func: (...args: any[]) => void): Disposable {
		return this.on('msg', func);
	}
}