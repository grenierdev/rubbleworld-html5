import * as React from 'react';
import * as Immutable from 'immutable';

import { Client } from '../net/Client';
import { LobbyPlayer } from '../gamemode/GameModeLobby';

export class Lobby extends React.PureComponent<{state: Immutable.Map<string, any>, client: Client}, {name: string}> {

	render(): any {
		const currentPlayerId: string = this.props.state.get('clientPlayerId');
		const players: LobbyPlayer[] = Object.values(this.props.state.get('players').toJS());
		return (
			<ul>
				{players.map(player => {
					if (currentPlayerId === player.id) {
						return (
							<li key={player.id}>
								<input type="text" value={this.state && this.state.name || ''} onChange={this.playerNameChanging.bind(this)} onBlur={this.playerNameChanged.bind(this)} />
								<button onClick={this.playerReady.bind(this, !player.ready)}>{player.ready ? 'Not ready' : 'Ready !'}</button>
							</li>
						);
					} else {
						return (
							<li key={player.id}>
								<input type="text" disabled value={player.name ? player.name : 'Noname'} />
								{player.ready ? " is ready" : ""}
							</li>
						);
					}
				})}
			</ul>
		)
	}

	playerNameChanging (e) {
		this.setState({ name: e.target.value });
	}

	playerNameChanged (e) {
		this.props.client.sendPayload({ type: 'NAME', name: this.state.name });
	}

	playerReady (ready, e) {
		this.props.client.sendPayload({ type: 'READY', ready: ready });
	}

}