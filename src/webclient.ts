import { Client } from './lib/Client/Client';
import { TransportWebWorker } from './lib/Client/TransportWebWorker';

const serverWorker = new Worker('js/webserver.js');
const transport = new TransportWebWorker(serverWorker);
const client = new Client(transport);

client.onMessageReceive((msg) => {

	console.log('From server', msg);

});

setInterval(() => {

	client.send({
		type: 'PING'
	});

}, 1000);