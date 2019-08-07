import 'mocha';
import { expect } from 'chai';
import { Store, Action } from './State';

describe('State', () => {
	it('change state', async () => {
		interface SetName extends Action {
			type: 'set_name';
			name: string;
		}

		type Actions = SetName;
		type State = { name: string };

		const store = new Store<State, Actions>(
			(state, action) => {
				if (action.name !== state.name) {
					return { name: action.name };
				}
				return state;
			},
			{
				name: 'unknown',
			}
		);

		let oldState = store.state;

		store.dispatch({ type: 'set_name', name: 'the name' });
		expect(store.state.name).to.eq('the name');
		expect(store.state).to.not.eq(oldState);

		oldState = store.state;

		store.dispatch({ type: 'set_name', name: 'the name' });
		expect(store.state).to.eq(oldState);
	});

	it('lobby impl', async () => {
		interface PlayerJoin extends Action {
			type: 'player_join';
			name: string;
		}

		interface PlayerLeave extends Action {
			type: 'player_leave';
			id: number;
		}

		interface PlayerRename extends Action {
			type: 'player_rename';
			id: number;
			newName: string;
		}

		type Actions = PlayerJoin | PlayerLeave | PlayerRename;
		type State = { players: Map<number, string> };

		let nextId = 0;
		const store = new Store<State, Actions>(
			(state, action) => {
				switch (action.type) {
					case 'player_join':
						return {
							players: new Map(state.players).set(++nextId, action.name),
						};
					case 'player_leave':
						if (state.players.has(action.id)) {
							const players = new Map(state.players);
							players.delete(action.id);
							return { players };
						}
						return state;
					case 'player_rename':
						return {
							players: new Map(state.players).set(action.id, action.newName),
						};
				}
			},
			{
				players: new Map(),
			}
		);

		store.dispatch({ type: 'player_join', name: 'A' });
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A']]) });
		store.dispatch({ type: 'player_join', name: 'B' });
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A'], [2, 'B']]) });
		store.dispatch({ type: 'player_leave', id: 2 });
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A']]) });
		store.dispatch({ type: 'player_join', name: 'C' });
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A'], [3, 'C']]) });
		store.dispatch({ type: 'player_rename', id: 3, newName: 'CC' });
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A'], [3, 'CC']]) });
	});

	it('subscribe', async () => {
		interface PlayerJoin extends Action {
			type: 'player_join';
			name: string;
		}

		interface PlayerLeave extends Action {
			type: 'player_leave';
			id: number;
		}

		interface PlayerRename extends Action {
			type: 'player_rename';
			id: number;
			newName: string;
		}

		type Actions = PlayerJoin | PlayerLeave | PlayerRename;
		type State = { players: Map<number, string> };

		let nextId = 0;
		const store = new Store<State, Actions>(
			(state, action) => {
				switch (action.type) {
					case 'player_join':
						return {
							players: new Map(state.players).set(++nextId, action.name),
						};
					case 'player_leave':
						const players = new Map(state.players);
						players.delete(action.id);
						return { players };
					case 'player_rename':
						return {
							players: new Map(state.players).set(action.id, action.newName),
						};
				}
			},
			{
				players: new Map(),
			}
		);

		const accumulator: Actions[] = [];

		store.subscribe((state, action) => accumulator.push(action));

		store.dispatch({ type: 'player_join', name: 'A' });
		expect(accumulator).to.deep.eq([{ type: 'player_join', name: 'A' }]);
		store.dispatch({ type: 'player_join', name: 'B' });
		expect(accumulator).to.deep.eq([{ type: 'player_join', name: 'A' }, { type: 'player_join', name: 'B' }]);
		store.dispatch({ type: 'player_leave', id: 2 });
		expect(accumulator).to.deep.eq([
			{ type: 'player_join', name: 'A' },
			{ type: 'player_join', name: 'B' },
			{ type: 'player_leave', id: 2 },
		]);
		store.dispatch({ type: 'player_join', name: 'C' });
		expect(accumulator).to.deep.eq([
			{ type: 'player_join', name: 'A' },
			{ type: 'player_join', name: 'B' },
			{ type: 'player_leave', id: 2 },
			{ type: 'player_join', name: 'C' },
		]);
		store.dispatch({ type: 'player_rename', id: 3, newName: 'CC' });
		expect(accumulator).to.deep.eq([
			{ type: 'player_join', name: 'A' },
			{ type: 'player_join', name: 'B' },
			{ type: 'player_leave', id: 2 },
			{ type: 'player_join', name: 'C' },
			{ type: 'player_rename', id: 3, newName: 'CC' },
		]);
		expect(store.state).to.deep.eq({ players: new Map<Number, string>([[1, 'A'], [3, 'CC']]) });
	});
});
