import { ServerTransport, ServerClient } from './Server';
import { Payload } from './Payload';
import { ClientTransport } from './Client';

declare var onconnect: (e: MessageEvent) => void;
declare var onerror: (e: any) => void;

export class SharedWorkerServerTransport extends ServerTransport {
	constructor() {
		super();

		onconnect = event => {
			this.emit('onReady');
			const client = new SharedWorkerServerClient(event.ports[0]);
			this.emit('onConnect', client);
		};

		onerror = event => {
			this.emit('onClose');
		};
	}
}

export class SharedWorkerServerClient extends ServerClient {
	constructor(public readonly port: MessagePort) {
		super();

		port.addEventListener('messageerror', event => {
			console.error(`SharedWorkerServerClient.messageerror`, event);
		});
		port.addEventListener('message', event => {
			if (event.data === 'hack:close') {
				this.emit('onDisconnect');
			} else {
				this.emit('onReceive', { ...event.data });
			}
		});
		port.start();
	}

	send(payload: Payload) {
		this.port.postMessage(payload);
	}
}

export class SharedWorkerClientTransport extends ClientTransport {
	constructor(public readonly worker: SharedWorker.SharedWorker) {
		super();

		worker.onerror = error => {
			this.emit('onDisconnect');
		};
		worker.port.addEventListener('messageerror', event => {
			console.error(`SharedWorkerClientTransport.messageerror`, event);
		});
		worker.port.addEventListener('message', event => {
			this.emit('onReceive', { ...event.data });
		});
		window.addEventListener('beforeunload', event => {
			worker.port.postMessage('hack:close');
		});
		worker.port.start();

		setTimeout(() => this.emit('onConnect'));
	}

	send(payload: Payload) {
		this.worker.port.postMessage(payload);
	}
}
