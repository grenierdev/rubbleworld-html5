import { ClientWebSharedWorker } from './lib/ClientWebSharedWorker';
import { GameModeLobby } from './lib/GameModeLobby';

const serverWorker = new SharedWorker('js/webserver.js');

const client = new ClientWebSharedWorker(serverWorker);
client.onClose(e => console.error(e));
client.onMessage((message) => console.debug('[CLI]', message));

setInterval(() => {
	client.sendPayload({
		type: 'PING'
	});
}, 10000);

const mode = new GameModeLobby(client);

declare var window: any;
window.client = client;
window.mode = mode;