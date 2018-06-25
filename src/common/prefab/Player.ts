import { coroutine } from '../engine/util/coroutine';
import { Component, Entity } from '../engine/Scene';
import { Gamepad } from '../engine/Gamepad';

export function PlayerPrefab () {
	return new Entity([new PlayerComponent(), new PlayerGun()]);
}

export class PlayerComponent extends Component {
	*onUpdate() {
		yield* this.runAnimation('run', 3);
	}

	*runAnimation(name: string, frames: number) {
		for (let i = 0; i < frames; ++i) {
			console.log(`run anim ${name}@${i}`);
			yield;
		}
	}
}

export class PlayerGun extends Component {
	onUpdate() {
		if (Gamepad.gamepad[0].getButtonDown('fire')) {
			console.log('Fire !');
		}
	}
}