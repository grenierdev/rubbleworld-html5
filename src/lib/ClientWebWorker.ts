import { Client } from './Client';
import { Payload } from './Message';

export class ClientWebWorker extends Client {

	protected webworker: Worker;

	constructor(webworker: Worker) {
		super();

		this.webworker = webworker;
		this.webworker.onerror = (e: ErrorEvent) => {
			this.emit('onDisconnect');
			this.emit('onClose', e.error);
			this.dispose();
		}
		this.webworker.onmessage = (e: MessageEvent) => {
			this.emit('onMessage', { ...e.data });
		}

		setTimeout(() => this.emit('onConnect'));

		console.log('ClientWebWorker');
	}

	sendPayload(payload: Payload): void {
		this.webworker.postMessage({
			ts: Date.now(),
			...payload
		});
	}

	disposeAsync(): Promise<void> {
		try {
			this.webworker.terminate();
			(this.webworker as any) = undefined;
		} catch (e) { }
		return super.disposeAsync();
	}

}