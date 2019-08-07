import { EventEmitter } from '@konstellio/eventemitter';
import { IDisposable } from '@konstellio/disposable';
import { Immutable, Mutable } from './util/Immutable';

export interface State {}

export interface Action {}

export class Store<S extends State, A extends Action> implements IDisposable {
	public readonly state: Immutable<S>;

	private emitter = new EventEmitter();
	private disposed = false;

	constructor(protected reducer: (prevState: Immutable<S>, action: A) => S | Immutable<S>, initialState: S) {
		this.state = initialState as Immutable<S>;
	}

	isDisposed() {
		return this.disposed;
	}

	async dispose() {
		if (!this.disposed) {
			await this.emitter.dispose();
			this.disposed = true;
		}
	}

	dispatch(action: A) {
		const state = this.reducer(this.state, action);
		if (state !== this.state) {
			this.emitter.emit('change', state, action, this.state);
			(this.state as S | Immutable<S>) = state;
		}
	}

	subscribe(listener: (newState: Immutable<S>, action: A, oldState: Immutable<S>) => void) {
		return this.emitter.on('change', listener);
	}
}
