import { Client } from './lib/Net/Client/Client';
import { TransportWebWorker } from './lib/Net/Client/Transport/TransportWebWorker';
import { Lobby } from './lib/GameMode/Lobby';

const serverWorker = new Worker('js/webserver.js');

const transport = new TransportWebWorker(serverWorker);
transport.onClose(e => console.error(e));

const client = new Client(transport);
client.onMessageReceive((message) => {
	console.debug('[CLI]', message);
});

// const mode = new GameModeLobby(client);
// mode.onPlayerJoined((player) => {
// 	console.log('[CLI]', 'Player joined', player.id, player.name);
// });

// mode.onPlayerLeft((player) => {
// 	console.log('[CLI]', 'Player left', player.id, player.name);
// });

const mode = new Lobby(client);


declare var window: any;
window.client = client;
window.mode = mode;