import { Disposable, CompositeDisposable } from 'konstellio-disposable';
import { EventEmitter  } from 'konstellio-eventemitter';
import { Map } from 'immutable';
import { createStore, Action, Store, Unsubscribe } from 'redux';
import Transport from './Transport';

export type TurnHash = string;
export type XP = number;

export type PlayerState = {
	name: string,
	xp: XP
}

export type GameState = {
	pause: {
		enabled: boolean,
		reason: string
	},
	turn: {
		id: TurnHash,
		timeLimit: number
	},
	players: PlayerState[]
}

export default abstract class Game extends EventEmitter {
	
	constructor (initialState: GameState){
		super();

		initialState.pause.reason
	}
}