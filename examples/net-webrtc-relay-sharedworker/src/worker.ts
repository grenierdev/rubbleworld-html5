import { Server } from '@fexel/core/net/Server';
import { SharedWorkerServerTransport } from '@fexel/core/net/TransportSharedWorker';
import { RelayServerTransport } from '@fexel/core/net/TransportRelay';

const transportWorker = new SharedWorkerServerTransport();
const relay = new RelayServerTransport(transportWorker);

const server = ((self as any).server = new Server([relay]));

server.onClientJoin(client => console.log('[SRV] Join', client));
server.onClientLeave(client => console.log('[SRV] Leave', client));
server.onReceive((client, payload) => {
	console.log('[SRV] Receive', client, payload);
	server.broadcastExcept(payload, client);
});
