import * as React from 'react';
import * as Immutable from 'immutable';

import { Client } from '../net/Client';
import { LobbyPlayer, payloadName, payloadReady } from '../gamemode/GameModeLobby';

export class Lobby extends React.Component<{state: Immutable.Map<string, any>, client: Client}, {name: string}> {

	render(): any {
		const currentPlayerId: string = this.props.state.get('clientPlayerId');
		const players: LobbyPlayer[] = Object.values(this.props.state.get('players').toJS());
		return (
			<ul>
			</ul>
		)
	}

}