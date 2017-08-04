import { Server } from './lib/Net/Server/Server';
import { TransportWebWorker } from './lib/Net/Server/Transport/TransportWebWorker';
import { Lobby } from './lib/GameMode/Lobby';


const transport = new TransportWebWorker();

const server = new Server(transport);
server.onMessageReceive((client, message) => {
	console.debug('[SRV]', message, 'from', client);
});

// const mode = new GameModeLobby(server);
// mode.onPlayerJoined((player) => {
// 	console.log('[SRV]', 'Player joined', player.id, player.name);
// });
// mode.onPlayerLeft((player) => {
// 	console.log('[SRV]', 'Player left', player.id, player.name);
// });

const mode = new Lobby(server);