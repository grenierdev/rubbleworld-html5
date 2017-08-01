import { CompositeDisposable, Disposable } from 'konstellio-disposable';

import { AGameMode } from './AGameMode';
import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';
import { Client as ServerClient } from '../Net/Server/Client';
import { Message, MessagePayload } from '../Net/Message';

import { createStore, applyMiddleware } from 'redux';

export type ReduxState = {
	players: any[]
}

export class GameModeRedux extends AGameMode {

	protected janitor: CompositeDisposable;

	constructor (netAdapter: Client | Server) {
		super(netAdapter);

		this.janitor = new CompositeDisposable();

		const initialState = {
			players: []
		};

		if (this.isServer) {
			const server: Server = this.netAdapter as Server;
			const store = createStore<ReduxState>((state, action) => {
				console.log('[SRV] Reducer', action);
				if (action.type === 'PLAYERJOINED') {
					return {
						players: state.players.concat([{
							id: action.id,
							name: action.name
						}])
					};
				}
				return state;
			}, initialState, applyMiddleware(store => next => action => {
				// console.log('Middle', action);
				const result = next(action);
				// console.log('Next', store.getState(), result);

				const state = store.getState();
				server.sendToAll({ type: 'STATE', state });
				return result;
			}));

			let nextPlayer = 0;
			setInterval(() => {
				store.dispatch({ type: 'PLAYERJOINED', id: ++nextPlayer, name: `Player${nextPlayer}` });
			}, 1000);
		}

		else {
			const client: Client = this.netAdapter as Client;
			const store = createStore<ReduxState>((state, action) => {
				console.log('[CLI] Reducer', action);
				return state;
			}, initialState);

			this.janitor.add(client.onMessageReceive((message) => {
				if (message.type === 'STATE') {
					console.log('[CLI] Message', message);
				}
			}));
		}
	}

}