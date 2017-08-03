import { CompositeDisposable, Disposable } from 'konstellio-disposable';
import { fromJS, Map, List } from 'immutable';
import * as diff from 'immutablediff';

import { AGameMode } from './AGameMode';
import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';
import { Client as ServerClient } from '../Net/Server/Client';
import { Message, MessagePayload } from '../Net/Message';

import { createStore, Store } from 'redux';

export class GameModeRedux extends AGameMode {

	protected janitor: CompositeDisposable;
	protected store: Store<Map<string, any>>;

	constructor (netAdapter: Client | Server) {
		super(netAdapter);

		this.janitor = new CompositeDisposable();

		const initialState = fromJS({
			settings: {
				nextPlayerId: 1
			},
			players: {}
		});

		this.store = createStore<Map<string, any>>((state, action) => {
			return state.withMutations(state => {
				if (action.type === 'CLIENT_CONNECTED') {
					const nextId = (state.getIn(['settings', 'nextPlayerId']) + 1).toString();
					state.setIn(['settings', 'nextPlayerId'], nextId);
					state.updateIn(['players'], players => players.set(nextId, Map({
						id: nextId,
						name: 'Unannounced'
					})));
					action.client.playerId = nextId;
				}
				else if (action.type === 'PLAYER_JOINED') {
					state.updateIn(['players'], players => players.set(action.player.id, Map(action.player)));
				}
				else if (action.type === 'CLIENT_PLAYER_RENAME') {
					state.setIn(['players', action.client.playerId, 'name'], action.name);
				}
				else if (action.type === 'PLAYER_RENAME') {
					state.setIn(['players', action.playerId, 'name'], action.name);
				}
				else {
					console.log('UNKNOWN ACTION', action);
				}
			});
		}, initialState);

		if (this.isServer) {
			const server: Server = this.netAdapter as Server;

			let previousState = this.store.getState();

			server.getClients().forEach(client => this.store.dispatch({ type: 'CLIENT_CONNECTED', client }));
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
					const changes: List<Map<string, any>> = diff(previousState, currentState);

					changes.forEach((change: Map<string, any>) => {
						const op: string = change.get('op');
						const path: string = change.get('path');
						const value: any = change.get('value');

						if (path.match(/^\/players\/[0-9]+$/)) {
							if (op === 'add') {
								server.sendToAll({ type: 'PLAYER_JOINED', player: value.toJS() });
							}
							else if (op === 'remove') {
								server.sendToAll({ type: 'PLAYER_LEFT', playerId: value.get('id') });
							}
						}
						else if (path.match(/^\/players\/[0-9]+\/name$/)) {
							if (op === 'replace') {
								const id = path.match(/^\/players\/([0-9]+)\/name$/)![1];
								server.sendToAll({ type: 'PLAYER_RENAME', playerId: id, name: value });
							}
						}
					});

					previousState = currentState;
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

}