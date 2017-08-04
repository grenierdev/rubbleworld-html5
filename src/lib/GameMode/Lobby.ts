import * as Immutable from 'immutable';

import { Redux } from './Redux';
import { Client } from '../Net/Client/Client';
import { Server } from '../Net/Server/Server';
import { ClientInterface } from '../Net/Server/ClientInterface';

export interface LobbyClient extends ClientInterface {
	playerId: string
}

export class Lobby extends Redux {


	constructor (netAdapter: Client | Server) {
		super(netAdapter, Immutable.fromJS({
			settings: {
				nextPlayerId: 0
			},
			players: {}
		}));

		this.reduceAction<{client: LobbyClient}>('CLIENT_CONNECTED', (state, { client }) => {
			const nextId = (state.getIn(['settings', 'nextPlayerId']) + 1).toString();
			state.setIn(['settings', 'nextPlayerId'], nextId);
			state.updateIn(['players'], players => players.set(nextId, Immutable.Map({
				id: nextId,
				name: 'Unannounced'
			})));
			client.playerId = nextId;
		});
		this.reduceAction<{player: any}>('PLAYER_JOINED', (state, { player }) => {
			state.updateIn(['players'], players => players.set(player.id, Immutable.Map(player)));
		});
		this.reduceAction<{client: LobbyClient, name: string}>('CLIENT_PLAYER_RENAME', (state, { client, name }) => {
			state.setIn(['players', client.playerId, 'name'], name);
		});
		this.reduceAction<{playerId: string, name: string}>('PLAYER_RENAME', (state, { playerId, name }) => {
			state.setIn(['players', playerId, 'name'], name);
		});

		if (this.isServer) {
			const server: Server = this.netAdapter as Server;

			this.dispatchState('add/players/:id', (params, value, previousState, state) => {
				server.sendToAll({ type: 'PLAYER_JOINED', player: value.toJS() });
			});
			this.dispatchState('remove/players/:id', (params, value, previousState, state) => {
				server.sendToAll({ type: 'PLAYER_LEFT', player: params.id });
			});
			this.dispatchState('replace/players/:id/name', (params, value, previousState, state) => {
				server.sendToAll({ type: 'PLAYER_RENAME', playerId: params.id, name: value });
			});
		}
	}

}