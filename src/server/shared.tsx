import { ServerCombiner } from "../common/net/ServerCombiner";
import { ServerWebSharedWorker } from "../common/net/ServerWebSharedWorker";



const server = new ServerCombiner([new ServerWebSharedWorker()]);
server.onClose(e => console.error(e));
server.onClientConnect(client => console.log('[SRV] Connected', client.id));
server.onClientDisconnect(client => console.log('[SRV] Disconnected', client.id));
server.onMessage((client, message) => {
	console.log('[SRV]', message, 'from', client.id);
	client.sendPayload(message);
});