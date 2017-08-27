import * as React from 'react';
import * as Immutable from 'immutable';

import { Client } from '../net/Client';
import { Scene } from '../net/Scene';
import { PlayerEntity, PlayerActor } from '../gamemode/GameModeLobby';

export class Lobby extends React.Component<{ scene: Scene, client: Client }, { name: string }> {

	render(): any {
		const scene = this.props.scene;
		const players = scene.getEntityByType<PlayerEntity>('PlayerEntity');
		const actor = scene.getActorByType<PlayerActor>('PlayerActor')[0];
		// const currentPlayerId: string = this.props.state.get('clientPlayerId');
		// const players: LobbyPlayer[] = Object.values(this.props.state.get('players').toJS());
		return (
			<div>
				{players.map(player => {
					if (actor && actor.canControl(player)) {
						return (
							<div>
								<input
									type="text"
									value={player.name}
									onChange={(e) => this.setState({ name: e.target.value })}
									onBlur={(e) => player.setName(this.state.name)}
								/>
							</div>
						)
					}
					else {
						return (
							<div>
								{player.name}
							</div>
						);
					}
				})}
			</div>
		)
	}

}