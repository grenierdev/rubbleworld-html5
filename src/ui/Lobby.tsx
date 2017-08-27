import * as React from 'react';
import * as Immutable from 'immutable';

import { Client } from '../net/Client';
import { Scene } from '../net/Scene';
import { PlayerActor, PlayerEntity } from '../gamemode/GameModeLobby';

export class Lobby extends React.Component<{ scene: Scene<PlayerActor>, client: Client }, { name: string }> {

	render(): any {
		const scene = this.props.scene;
		const players = scene.getEntityByType<PlayerEntity>('PlayerEntity');
		const actor = scene.getActors()[0];
		return (
			<div>
				{players.map(player => {
					if (actor.canControl(player.id)) {
						return (
							<div>
								<input
									type="text"
									value={this.state && this.state.name || player.name}
									onChange={(e) => this.setState({ name: e.target.value })}
									onBlur={(e) => player.setName(this.state && this.state.name || player.name)}
								/>
								<button onClick={(e) => player.setReady(!player.ready)}>
									{player.ready ? 'Wait !' : 'Ready !'}
								</button>
							</div>
						)
					}
					else {
						return (
							<div>
								{player.name} {player.ready ? ' is ready' : ' is not ready'}
							</div>
						);
					}
				})}
			</div>
		)
	}

}