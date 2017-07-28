import { IDisposableAsync, Disposable } from 'konstellio-disposable';
import { EventEmitter, IEventEmitter } from 'konstellio-eventemitter';
import Client from './Client';

export type Payload = {
	type: string
	ts: number
	[key: string]: any
}

export type PayloadData = {
	type: string
	[key: string]: any
}

export default abstract class Transport extends EventEmitter implements IDisposableAsync {

	constructor () {
		super();
	}

	abstract isDisposed (): boolean
	abstract disposeAsync (): Promise<void>

	abstract sendTo (client: Client, payload: PayloadData): Payload;
	abstract sendToAll (payload: PayloadData): Payload;
	abstract receive (handler: (from: any, payload: Payload) => void): Disposable;
}
