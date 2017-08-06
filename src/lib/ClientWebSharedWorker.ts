import { Client } from './Client';
import { Payload } from './Message';

export class ClientWebSharedWorker extends Client {

	protected worker: SharedWorker.SharedWorker;

	constructor(worker: SharedWorker.SharedWorker) {
		super();

		this.worker = worker;
		this.worker.onerror = (e: ErrorEvent) => {
			this.emit('onDisconnect');
			this.emit('onClose', e.error);
			this.dispose();
		}
		this.worker.port.addEventListener('message', (e: MessageEvent) => {
			this.emit('onMessage', { ...e.data });
		});
		this.worker.port.start();

		setTimeout(() => this.emit('onConnect'));

		console.log('ClientWebSharedWorker');
	}

	sendPayload(payload: Payload): void {
		this.worker.port.postMessage({
			ts: Date.now(),
			...payload
		});
	}

	disposeAsync(): Promise<void> {
		try {
			this.worker.port.close();
			(this.worker as any) = undefined;
		} catch (e) { }
		return super.disposeAsync();
	}

}