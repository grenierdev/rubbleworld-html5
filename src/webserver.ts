import { Server } from './lib/Server/Server';
import { TransportWebWorker } from './lib/Server/TransportWebWorker';


const transport = new TransportWebWorker();
const server = new Server(transport);

server.onMessageReceive((client, msg) => {
	if (msg.type === 'PING') {
		server.sendTo(client, { type: 'PONG', latency: Date.now() - msg.ts });
	}

	else {
		console.log('Unkown msg from client', client.id, msg);
	}
});