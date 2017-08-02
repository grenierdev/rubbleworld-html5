const Immutable = require('immutable');
const diff = require('immutablediff');

const A = Immutable.fromJS({
	players: [{
		id: 1,
		name: 'Bob',
		life: 10
	}]
});

const B = A
	.withMutations(A => {
		A.setIn(['players', 0, 'life'], 4);
		A.updateIn(['players'], players => players.push({
		    id: 2,
		    name: 'Paul',
		    life: 10
		}));
	})
	// .updateIn(['players', 0, 'life'], (life) => 4)
	// .updateIn(['players'], (players) => players.push({
	//     id: 2,
	//     name: 'Paul',
	//     life: 10
	// }))

console.log(diff(A, B).toJS());