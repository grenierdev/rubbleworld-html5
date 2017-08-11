import * as React from 'react';
import * as Immutable from 'immutable';
import { List, ListItem } from 'material-ui/List';
import Toggle from 'material-ui/Toggle';
import TextField from 'material-ui/TextField';
import Done from 'material-ui/svg-icons/action/done';

import { Client } from '../net/Client';
import { LobbyPlayer, payloadName, payloadReady } from '../gamemode/GameModeLobby';

export class Lobby extends React.Component<{state: Immutable.Map<string, any>, client: Client}, {name: string}> {

	render(): any {
		const currentPlayerId: string = this.props.state.get('clientPlayerId');
		const players: LobbyPlayer[] = Object.values(this.props.state.get('players').toJS());
		return (
			<List>
				{players.map(player => {
					if (player.id === currentPlayerId) {
						const input = <TextField id="text-field-default"
							value={this.state && this.state.name || 'Noname'}
							onChange={(e, value) => {
								this.setState({ name: value });
								this.props.client.sendPayload(payloadName(value))
							}}
						/>;
						const toggle = <Toggle
							toggled={player.ready}
							onToggle={(e, value) => this.props.client.sendPayload(payloadReady(value))}
						/>;
						return (
							<ListItem key={player.id}
								primaryText={input}
								rightToggle={toggle}
							/>
						);
					} else {
						return (
							<ListItem key={player.id}
								primaryText={player.name ? player.name : 'Noname'}
								rightIcon={player.ready ? <Done /> : null}
							/>
						);
					}
				})}
			</List>
		)
	}

}