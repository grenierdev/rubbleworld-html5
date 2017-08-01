import { Server } from './lib/Net/Server/Server';
import { TransportWebWorker } from './lib/Net/Server/Transport/TransportWebWorker';
import { GameModeLobby } from './lib/GameMode/GameModeLobby';


const transport = new TransportWebWorker();

const server = new Server(transport);
server.onMessageReceive((client, msg) => {
	console.debug('[SRV]', '=>', msg);
});
server.onClientConnect((client) => {
	console.log('[SRV]', 'Client connected', client.id);
});
server.onClientDisconnect((client) => {
	console.log('[SRV]', 'Client disconnected', client.id);
});

const mode = new GameModeLobby(server);
mode.onPlayerJoined((player) => {
	console.log('[SRV]', 'Player joined', player.id, player.name);
});
mode.onPlayerLeft((player) => {
	console.log('[SRV]', 'Player left', player.id, player.name);
});