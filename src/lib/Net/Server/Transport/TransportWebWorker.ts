import { ATransport } from './ATransport';
import { Message, MessagePayload } from '../../Message';
import { Client } from '../Client';

export class TransportWebWorker extends ATransport {

	constructor () {
		super();

		const webclient = new Client();
		this.clients.set(webclient.id, webclient);
		this.emit('onConnect', webclient);

		onerror = (e: ErrorEvent) => {
			this.emit('onClose', e.error);
			this.dispose();
		}

		onmessage = (e: MessageEvent) => {
			this.emit('onMessageReceive', webclient, Object.assign({ }, e.data));
		}
	}

	dispose (): void {
		super.dispose();
		close();
	}
	
	sendTo (client: Client, payload: MessagePayload): void {
		postMessage(Object.assign({ ts: Date.now() }, payload));
	}

	sendToAll (payload: MessagePayload): void {
		postMessage(Object.assign({ ts: Date.now() }, payload));
	}

}