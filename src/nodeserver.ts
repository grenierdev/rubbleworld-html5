// import { EventEmitter } from 'konstellio-eventemitter';
// import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

// import { Message, Payload } from './net/Message';
// import { Client } from './net/Client';
// import { Server } from './net/Server';

// interface Action {
// 	type: string;
// 	[payload: string]: any;
// }






// export class Observer {

// }

// export class PlayerEntity extends Entity {
// 	static handle: string = 'PlayerEntity';

// 	@Replicated(Type.String)
// 	name: string;

// 	@Replicated(Type.String)
// 	ready: boolean;

// 	constructor(id: string, name: string, ready: boolean) {
// 		super(id);

// 		this.name = name;
// 		this.ready = !!ready;
// 	}

// 	@RPC()
// 	setReady(ready: boolean): void {
// 		console.log('Ready', ready);
// 		this.ready = ready;
// 	}
// }


// class DummyServer extends Server {

// }

// class DummyClient extends Client {
// 	sendPayload(payload: Payload): void {

// 	}
// }

// const client = new DummyServer();
// const scene = new Scene(client);
// scene.registerEntity(PlayerEntity);

// scene.on('onSceneChanged', (changes: [Entity, EntityChanges][]) => {
// 	changes.forEach(([entity, changes]) => {
// 		if (changes === true) {
// 			console.log('Added', (entity.constructor as typeof Entity).name, entity.id, entity.getState());
// 		}
// 		else if (changes === undefined) {
// 			console.log('Removed', entity.id);
// 		}
// 		else {
// 			console.log('Updated', entity.id, changes);
// 		}
// 	})
// });

// const p1 = scene.spawnEntity<PlayerEntity>('PlayerEntity', 'Bob');
// const p2 = scene.spawnEntity<PlayerEntity>('PlayerEntity', 'George');
// const p3 = scene.spawnEntity<PlayerEntity>('PlayerEntity', 'Sophy');


// p1.setReady(true);
// // (p2 as any).setReady(RPCfromServer, true);
// scene.removeEntity(p2);


// // s.dispatchAction({ type: 'READY', id: e1.id, ready: true });
// // s.removeEntity(s.getEntityById(e1.id));
// // s.dispatchAction({ type: 'READY', id: e3.id, ready: true });