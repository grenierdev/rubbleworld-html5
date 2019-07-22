import { ServerTransport, ServerClient } from './Server';
import { Payload } from './Payload';
import { ClientTransport } from './Client';

export class WorkerServerTransport extends ServerTransport {
	constructor() {
		super();

		setTimeout(() => {
			this.emit('onReady');
			const client = new WorkerServerClient();
			this.emit('onConnect', client);
		});
	}
}

export class WorkerServerClient extends ServerClient {
	constructor() {
		super();

		onerror = event => {
			this.emit('onClose');
		};

		onmessage = event => {
			this.emit('onReceive', { ...event.data });
		};

		onmessageerror = event => {
			console.error(`WorkerServerClient.messageerror`, event);
		};
	}

	send(payload: Payload) {
		postMessage(payload, '*');
	}
}

export class WorkerClientTransport extends ClientTransport {
	constructor(public readonly worker: Worker) {
		super();

		worker.addEventListener('error', error => {
			this.emit('onDisconnect');
		});
		worker.addEventListener('message', event => {
			this.emit('onReceive', { ...event.data });
		});

		setTimeout(() => this.emit('onConnect'));
	}

	send(payload: Payload) {
		this.worker.postMessage(payload);
	}
}
