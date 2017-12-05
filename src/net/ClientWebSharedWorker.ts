import { Client } from './Client';
import { Payload } from './Message';

declare var window: any;

export class ClientWebSharedWorker extends Client {

	protected worker: any; //SharedWorker.SharedWorker;

	constructor(worker: any) {
		super();

		this.worker = worker;
		this.worker.onerror = (e: ErrorEvent) => {
			this.emit('onDisconnect');
			this.emit('onClose', e.error);
			this.dispose();
		}
		this.worker.port.addEventListener('message', (e: MessageEvent) => {
			e.stopPropagation();
			this.emit('onMessage', { ...e.data });
		});
		window.addEventListener('beforeunload', (e) => {
			this.worker.port.postMessage('hack:close');
		});
		this.worker.port.start();

		setTimeout(() => this.emit('onConnect'));
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