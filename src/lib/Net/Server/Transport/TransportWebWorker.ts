import { ATransport } from './ATransport';
import { Message, MessagePayload } from '../../Message';
import { ClientInterface } from '../ClientInterface';

export class TransportWebWorker extends ATransport {

	constructor () {
		super();

		const webclient: ClientInterface = {};
		this.clients.push(webclient);
		this.emit('onConnect', webclient);

		onerror = (e: ErrorEvent) => {
			this.emit('onClose', e.message);
			this.dispose();
		}

		onmessage = (e: MessageEvent) => {
			this.emit('onMessageReceive', webclient, Object.assign({ }, e.data));
		}
	}

	disposeAsync (): Promise<void> {
		close();
		return super.disposeAsync();
	}
	
	sendTo (client: Client, payload: MessagePayload): void {
		postMessage(Object.assign({ ts: Date.now() }, payload));
	}

	sendToAll (payload: MessagePayload): void {
		postMessage(Object.assign({ ts: Date.now() }, payload));
	}

}