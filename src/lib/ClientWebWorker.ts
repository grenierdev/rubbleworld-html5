import { Client } from './Client';
import { Payload } from './Message';

export class ClientWebWorker extends Client {

	protected worker: Worker;

	constructor(worker: Worker) {
		super();

		this.worker = worker;
		this.worker.onerror = (e: ErrorEvent) => {
			this.emit('onDisconnect');
			this.emit('onClose', e.error);
			this.dispose();
		}
		this.worker.onmessage = (e: MessageEvent) => {
			this.emit('onMessage', { ...e.data });
		}

		setTimeout(() => this.emit('onConnect'));
	}

	sendPayload(payload: Payload): void {
		this.worker.postMessage({
			ts: Date.now(),
			...payload
		});
	}

	disposeAsync(): Promise<void> {
		try {
			this.worker.terminate();
			(this.worker as any) = undefined;
		} catch (e) { }
		return super.disposeAsync();
	}

}