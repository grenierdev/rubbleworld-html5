import { Server } from '@fexel/core/net/Server';
import { Client } from '@fexel/core/net/Client';
import { WebRTCClientTransport, WebRTCServerTransport } from '@fexel/core/net/TransportWebRTC';

// https://github.com/grenierdev/rubbleworld-html5/blob/e8432d9f71a77204887bac7be4cbc4c97efcb219/src/client/index.tsx

(window as any).createServer = () => {
	const server = new Server([
		new WebRTCServerTransport({
			label: 'data',
			maxConnections: 2,
			channel: {
				ordered: true,
			},
		}),
	]);
	server.onClientJoin(client => console.log('[SRV] Join', client));
	server.onClientLeave(client => console.log('[SRV] Leave', client));
	server.onReceive((client, payload) => console.log('[SRV] Receive', client, payload));
};

(window as any).createClient = (desc: RTCSessionDescriptionInit) => {
	const client = new Client(
		new WebRTCClientTransport({
			label: 'data',
			remoteDescription: desc,
		})
	);
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));
};
