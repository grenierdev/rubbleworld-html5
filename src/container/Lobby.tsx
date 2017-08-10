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
				{players.map(player => {
					if (currentPlayerId === player.id) {
						return (
							<li key={player.id}>
								<input
									type="text"
									placeholder="Noname"
									value={this.state && this.state.name || ''}
									onChange={(e) => this.setState({ name: e.target.value })}
									onBlur={(e) => this.props.client.sendPayload(payloadName(this.state && this.state.name || ''))}
								/>
								<button
									onClick={(e) => this.props.client.sendPayload(payloadReady(!player.ready))}
								>
									{player.ready ? 'Not ready' : 'Ready !'}
								</button>
							</li>
						);
					} else {
						return (
							<li key={player.id}>
								<input
									type="text"
									disabled
									value={player.name ? player.name : 'Noname'}
								/>
								{player.ready ? " is ready" : ""}
							</li>
						);
					}
				})}
			</ul>
		)
	}

}