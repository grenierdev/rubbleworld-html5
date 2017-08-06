import { ServerCombiner } from './lib/ServerCombiner';
import { ServerWebSharedWorker } from './lib/ServerWebSharedWorker';
import { GameModeLobby } from './lib/GameModeLobby';

const server = new ServerCombiner([new ServerWebSharedWorker()]);
server.onClose(e => console.error(e));
server.onMessage((client, message) => console.debug('[SRV]', message, 'from', client.id));

server.onMessage((client, message) => {
	if (message.type === 'PING') {
		client.sendPayload({ type: 'PONG', latency: Date.now() - message.ts });
	}
});

const mode = new GameModeLobby(server);