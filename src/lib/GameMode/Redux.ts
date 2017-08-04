import { CompositeDisposable, Disposable } from 'konstellio-disposable';
import * as Immutable from 'immutable';
import * as diff from 'immutablediff';
import * as pathToRegexp from 'path-to-regexp';

import { AGameMode } from './AGameMode';
import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';
import { ClientInterface } from '../Net/Server/ClientInterface';
import { Message, MessagePayload } from '../Net/Message';

import { createStore, Store, Reducer, Action } from 'redux';

export type Dispatcher = (params: any, value: any, previousState: Immutable.Map<string, any>, currentState: Immutable.Map<string, any>) => void;

export class Redux extends AGameMode {

	protected janitor: CompositeDisposable;
	protected store: Store<Immutable.Map<string, any>>;
	protected reducers: Map<string, (state: Immutable.Map<string, any>, action: Action) => void>;
	protected dispatchers: Map<pathToRegexp.PathRegExp, Dispatcher>;

	constructor (netAdapter: Client | Server, initialState: Immutable.Map<string, any>) {
		super(netAdapter);

		this.janitor = new CompositeDisposable();
		this.reducers = new Map<string, (state: Immutable.Map<string, any>, action: Action) => void>();
		this.dispatchers = new Map<pathToRegexp.PathRegExp, Dispatcher>();

		this.store = createStore<Immutable.Map<string, any>>((state, action) => {
			return state.withMutations(state => {
				this.reducers.forEach((reducer: (state: Immutable.Map<string, any>, action: Action) => void, type: string) => {
					if (action.type === type) {
						reducer(state, action);
					}
				});
			});
		}, initialState);

		

		if (this.isServer) {
			const server: Server = this.netAdapter as Server;

			let previousState = this.store.getState();

			setTimeout(() => server.getClients().forEach(client => this.store.dispatch({ type: 'CLIENT_CONNECTED', client })));
			this.janitor.add(server.onClientConnect(client => this.store.dispatch({ type: 'CLIENT_CONNECTED', client })));
			this.janitor.add(server.onClientDisconnect(client => this.store.dispatch({ type: 'CLIENT_DISCONNECTED', client })));
			this.janitor.add(server.onMessageReceive((client, message) => {
				this.store.dispatch({
					...message,
					client,
					type: `CLIENT_${message.type}`
				});
			}));

			setInterval(() => {
				const currentState = this.store.getState();

				if (previousState !== currentState) {
					const changes: Immutable.List<Immutable.Map<string, any>> = diff(previousState, currentState);

					changes.forEach((change: Immutable.Map<string, any>) => {
						const path: string = `${change.get('op')}${change.get('path')}`;
						const value: any = change.get('value');

						this.dispatchers.forEach((dispatcher, re) => {
							const match = re.exec(path);
							if (match) {
								const params: any = {};
								for (let i = 1; i < match.length; ++i) {
									const key = re.keys[i - 1];

									params[key.name] = match[i];
								}

								dispatcher(params, value, previousState, currentState);
							}
						});

						previousState = currentState;
					});
				}
			}, 1000 * 1);
		}

		else {
			const client: Client = this.netAdapter as Client;

			this.janitor.add(client.onMessageReceive((message) => {
				this.store.dispatch(message);
			}));
		}
	}

	disposeAsync (): Promise<void> {
		return this.janitor.disposeAsync().then(super.disposeAsync);
	}

	reduceAction<T> (type: string, reducer: (state: Immutable.Map<string, any>, action: T) => void) {
		this.reducers.set(type, reducer as any);
	}

	dispatchState (path: string, dispatcher: Dispatcher) {
		this.dispatchers.set(pathToRegexp(path), dispatcher);
	}

}

