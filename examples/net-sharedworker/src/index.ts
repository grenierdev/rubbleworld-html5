import { Client } from '@fexel/core/net/Client';
import { SharedWorkerClientTransport } from '@fexel/core/net/TransportSharedWorker';

(window as any).createClient = () => {
	const client = new Client(new SharedWorkerClientTransport(new SharedWorker('./worker.ts')));
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));

	return client;
};
