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

/**
 * 1. Create server
 * server = createWebRTCServer()
 *
 * 2. Create offer for other player to join
 * [offer, candidates, accept] = await server.transports[0].createOffer();
 * console.log(JSON.stringify(offer));
 * console.log(JSON.stringify(candidates));
 *
 * 3. Send off _offer_ & _candidates_ to joinning player by any means
 *
 * 4. Accept _answer_ & _candidates_ of joinning player
 * accept(answer, candidate);
 *
 * 5. Enjoy !
 */
(window as any).createWebRTCServer = () => {
	const server = new Server([new WebRTCServerTransport()]);

	server.onClientJoin(client => console.log('[SRV] Join', client));
	server.onClientLeave(client => console.log('[SRV] Leave', client));
	server.onReceive((client, payload) => {
		console.log('[SRV] Receive', client, payload);
		server.broadcastExcept(payload, client);
	});

	return server;
};

/**
 * 1. Receive _offer_ & _candidates_ from hosting player
 *
 * 2. Create transport from _offer_ & _candidate_
 * client = await createWebRTCClient(offer, candidates, (answer, candidates) => { console.log(JSON.stringify(answer)); console.log(JSON.stringify(candidates)); })
 *
 * 3. Send back _answer_ & _candidates_ to hosting player
 *
 * 4. Wait for hosting player to accept connection
 */
(window as any).createWebRTCClient = async (
	offer: RTCSessionDescriptionInit,
	remoteCandidates: RTCIceCandidateInit[],
	onAnswer: (answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) => void
) => {
	const [answer, localCandidates, transport] = await WebRTCClientTransport.createConnection(offer, remoteCandidates);
	onAnswer(answer, localCandidates);

	const client = new Client(transport);
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));

	return client;
};
