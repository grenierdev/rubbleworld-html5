import { Server } from '@fexel/core/net/Server';
import { Client } from '@fexel/core/net/Client';
import { WebRTCClientTransport, WebRTCServerTransport } from '@fexel/core/net/TransportWebRTC';
import { SharedWorkerClientTransport } from '@fexel/core/net/TransportSharedWorker';

// https://github.com/grenierdev/rubbleworld-html5/blob/e8432d9f71a77204887bac7be4cbc4c97efcb219/src/client/index.tsx

(window as any).createWorker = () => {
	const client = new Client(new SharedWorkerClientTransport(new SharedWorker('./worker.ts')));
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));

	return client;
};

/* USAGE
const server = createWebRTCServer();
const invite = await server.transports[0].createInvite();
console.log(JSON.stringify(invite.description.toJSON()))

invite.accept(...);
*/
(window as any).createWebRTCServer = () => {
	const server = new Server([
		new WebRTCServerTransport({
			label: 'data',
			channel: {
				ordered: true,
			},
		}),
	]);

	server.onClientJoin(client => console.log('[SRV] Join', client));
	server.onClientLeave(client => console.log('[SRV] Leave', client));
	server.onReceive((client, payload) => {
		console.log('[SRV] Receive', client, payload);
		server.broadcastExcept(payload, client);
	});

	return server;
};

/* USAGE
const client = await createWebRTCClient(..., answer => console.log(JSON.stringify(answer.toJSON())))
*/
(window as any).createWebRTCClient = async (
	desc: RTCSessionDescriptionInit,
	onAnswer: (answer: RTCSessionDescription) => void
) => {
	const transport = await WebRTCClientTransport.createTransport({ description: desc, onAnswer });

	const client = new Client(transport);
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));

	return client;
};
