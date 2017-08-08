import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ClientWebSharedWorker } from './net/ClientWebSharedWorker';
import { GameModeLobby } from './gamemode/GameModeLobby';

import { Lobby } from './container/Lobby';

declare var window: any;

const serverWorker = new SharedWorker('js/webserver.js');
const client = new ClientWebSharedWorker(serverWorker);
client.onClose(e => console.error(e));
client.onMessage((message) => console.debug('[CLI]', message));

setInterval(() => {
	client.sendPayload({
		type: 'PING'
	});
}, 10000);

declare var document: any;

const mode = new GameModeLobby(client);
const game = document.getElementById('game');


mode.onChange((state, action) => {
	ReactDOM.render(<Lobby state={state} client={client} />, game);
});

window.client = client;
window.mode = mode;