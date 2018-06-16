import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";

// import { ClientWebSharedWorker } from "../common/net/ClientWebSharedWorker";
import { ClientWebRTC } from "../common/net/ClientWebRTC";
import { ServerWebRTC } from "../common/net/ServerWebRTC";

const rootEl = document.getElementById("root");
ReactDOM.render(
	<App />,
	rootEl
);

// if (module.hot) {
// 	module.hot.dispose(function () {
// 		// module is about to be replaced
// 	});

// 	module.hot.accept(function () {
// 		// module or one of its dependencies was just updated
// 	});
// }

declare var window: any;

// const serverWorker = new SharedWorker('server-shared.js');
// const client = new ClientWebSharedWorker(serverWorker);
// client.onClose(e => console.error(e));
// client.onConnect(() => console.log('[CLI] Connected', client.id));
// client.onDisconnect(() => console.log('[CLI] Disconnected', client.id));
// client.onMessage((message) => console.log('[CLI]', message));
// window.client = client;

window.createServer = () => {
	const server = window.server = new ServerWebRTC({
		label: 'data',
		maxConnections: 2,
		channel: {
			ordered: true
		}
	});
	server.onClose(e => console.error(e));
	server.onClientConnect(client => console.log('[SRV] Connected', client.id));
	server.onClientDisconnect(client => console.log('[SRV] Disconnected', client.id));
	server.onMessage((client, message) => {
		console.log('[SRV]', message, 'from', client.id);
		// client.sendPayload(message);
	});
	server.pendingClients.forEach(client => {
		client.onOffer((desc) => {
			console.log('[SRV] Offer', client.id, JSON.stringify(desc));
		});
	});
}

window.createClient = (desc: RTCSessionDescriptionInit) => {
	const client = window.client = new ClientWebRTC({
		label: 'data',
		remoteDescription: desc
	});
	client.onClose(e => console.error(e));
	client.onConnect(() => console.log('[CLI] Connected', client.id));
	client.onDisconnect(() => console.log('[CLI] Disconnected', client.id));
	client.onMessage((message) => console.log('[CLI]', message));
	client.onAnswer(desc => console.log('[CLI] Answer', JSON.stringify(desc)));
}