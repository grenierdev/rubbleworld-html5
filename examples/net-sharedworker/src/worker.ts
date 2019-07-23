import { Server } from '@fexel/core/net/Server';
import { SharedWorkerServerTransport } from '@fexel/core/net/TransportSharedWorker';

const server = new Server([new SharedWorkerServerTransport()]);

server.onClientJoin(client => console.log('[SRV] Join', client));
server.onClientLeave(client => console.log('[SRV] Leave', client));
server.onReceive((client, payload) => {
	console.log('[SRV] Receive', client, payload);
	server.broadcastExcept(payload, client);
});
