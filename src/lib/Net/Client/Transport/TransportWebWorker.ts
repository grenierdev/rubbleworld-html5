import { ATransport } from './ATransport';
import { MessagePayload } from '../../Message';

export class TransportWebWorker extends ATransport {

	protected worker: Worker;

	constructor (webWorker: Worker) {
		super();

		this.worker = webWorker;
		this.worker.onerror = (e: ErrorEvent) => {
			this.emit('onClose', e.error);
			this.dispose();
		}
		this.worker.onmessage = (e: MessageEvent) => {
			this.emit('onMessageReceive', Object.assign({ }, e.data));
		}
	}

	send (payload: MessagePayload): void {
		this.worker.postMessage(Object.assign({ ts: Date.now() }, payload));
	}
}