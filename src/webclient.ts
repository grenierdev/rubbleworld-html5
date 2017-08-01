import { Client } from './lib/Net/Client/Client';
import { TransportWebWorker } from './lib/Net/Client/Transport/TransportWebWorker';
import { GameModeLobby } from './lib/GameMode/GameModeLobby';

const serverWorker = new Worker('js/webserver.js');

const transport = new TransportWebWorker(serverWorker);

const client = new Client(transport);
client.onMessageReceive((msg) => {
	console.debug('[CLI]', '<=', msg);
});

const mode = new GameModeLobby(client);
mode.onPlayerJoined((player) => {
	console.log('[CLI]', 'Player joined', player.id, player.name);
});

mode.onPlayerLeft((player) => {
	console.log('[CLI]', 'Player left', player.id, player.name);
});


declare var window: any;
window.client = client;
window.mode = mode;