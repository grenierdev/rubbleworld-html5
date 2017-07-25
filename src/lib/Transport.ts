import { IDisposableAsync, Disposable } from 'konstellio-disposable';
import { EventEmitter, IEventEmitter } from 'konstellio-eventemitter';


export default abstract class Transport extends EventEmitter implements IDisposableAsync {

	constructor () {
		super();
	}

	abstract isDisposed (): boolean
	abstract disposeAsync (): Promise<void>

	abstract send (): void;
	abstract receive (func: (...args: any[]) => void): Disposable
}
