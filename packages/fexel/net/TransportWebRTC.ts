import { ServerTransport, ServerClient } from './Server';
import { Payload } from './Payload';
import { ClientTransport } from './Client';

// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ServerWebRTC.ts
// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ClientWebRTC.ts

export interface WebRTCServerTransportConstructor {
	label: string;
	maxConnections: number;
	servers?: RTCIceServer[];
	channel?: RTCDataChannelInit;
}

export class WebRTCServerTransport extends ServerTransport {
	constructor(public readonly params: WebRTCServerTransportConstructor) {
		super();
	}
}

export class WebRTCServerClient extends ServerClient {
	constructor(public readonly connection: RTCPeerConnection, public readonly channel: RTCDataChannel) {
		super();

		connection.createOffer().then(desc => {
			connection.setLocalDescription(desc).then(
				() => {
					this.emit('onOffer', connection.localDescription);
				},
				err => {}
			);
		});
		connection.onicecandidate = candidate => {
			if (candidate === null) {
				console.trace('onReady', connection);
			}
		};
		connection.onicecandidateerror = e => {
			console.trace('onicecandidateerror', e);
		};
		connection.onsignalingstatechange = e => {
			console.trace('onsignalingstatechange', e);
		};
		connection.oniceconnectionstatechange = e => {
			console.trace('oniceconnectionstatechange', e, connection.iceConnectionState);
			switch (connection.iceConnectionState) {
				case 'completed':
					this.emit('onConnect');
					break;
				case 'disconnected':
					this.emit('onDisconnect');
					break;
				case 'closed':
				case 'failed':
					this.emit('onClose');
					break;
			}
		};
		connection.onicegatheringstatechange = e => {
			console.trace('onicegatheringstatechange', e);
		};

		// channel.onopen = () => {
		// 	this.emit('onConnect');
		// }
		// channel.onerror = (err) => {
		// 	this.emit('onClose', err);
		// }
		channel.onmessage = e => {
			const data = JSON.parse(e.data);
			this.emit('onReceive', { ...data });
		};
	}

	send(payload: Payload) {
		this.channel.send(JSON.stringify(payload));
	}

	setAnswer(answer: RTCSessionDescriptionInit) {
		this.connection
			.setRemoteDescription(answer)
			.then(() => this.emit('onAnswer', this.connection.remoteDescription))
			.catch(err => this.emit('onClose', err));
	}

	onOffer(listener: (description: RTCSessionDescription) => void) {
		return this.on('onOffer ', listener);
	}

	onAnswer(listener: (description: RTCSessionDescription) => void) {
		return this.on('onAnswer ', listener);
	}
}

export interface WebRTCClientTransportConstructor {
	label: string;
	remoteDescription: RTCSessionDescriptionInit;
	iceServers?: RTCIceServer[];
	channel?: RTCDataChannelInit;
}

export class WebRTCClientTransport extends ClientTransport {
	constructor(public readonly params: WebRTCClientTransportConstructor) {
		super();
	}

	send(payload: Payload) {}
}
