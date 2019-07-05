import { Disposable } from '@konstellio/disposable';

import { Client } from './Client';
import { Payload } from './Message';

export interface ClientWebRTCConf {
	label: string;
	remoteDescription: RTCSessionDescriptionInit;
	iceServers?: RTCIceServer[];
	channel?: RTCDataChannelInit;
}

export type AnswerEventListener = (description: RTCSessionDescription) => void;
export type ReadyEventListener = (connection: RTCPeerConnection) => void;

export class ClientWebRTC extends Client {
	protected peerConnection: RTCPeerConnection;
	protected peerChannel?: RTCDataChannel;

	constructor(public readonly conf: ClientWebRTCConf) {
		super();

		// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection
		this.peerConnection = new RTCPeerConnection({
			iceServers: conf.iceServers
				? conf.iceServers
				: [
						{ urls: 'stun:stun.1.google.com:19302' },
						// { urls: 'stun:stun1.l.google.com:19302' },
						// { urls: 'stun:stun2.l.google.com:19302' },
						// { urls: 'stun:stun3.l.google.com:19302' },
						// { urls: 'stun:stun4.l.google.com:19302' },
				  ],
		});

		const emitError = (err: DOMError) => {
			this.emit('onDisconnect');
			this.emit('onClose', err);
		};

		this.peerConnection.onicecandidate = candidate => {
			if (candidate === null) {
				this.emit('onReady', this.peerConnection);
			}
		};
		this.peerConnection.onicecandidateerror = e => {
			console.trace('onicecandidateerror', e);
		};
		this.peerConnection.onsignalingstatechange = e => {
			console.trace('onsignalingstatechange', e);
		};
		this.peerConnection.oniceconnectionstatechange = e => {
			console.trace(
				'oniceconnectionstatechange',
				e,
				this.peerConnection.iceConnectionState
			);
			switch (this.peerConnection.iceConnectionState) {
				case 'connected':
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
		this.peerConnection.onicegatheringstatechange = e => {
			console.trace('onicegatheringstatechange', e);
		};

		this.peerConnection.ondatachannel = e => {
			this.peerChannel = e.channel;

			// this.peerChannel.onopen = () => {
			// 	this.emit('onConnect');
			// }
			// this.peerChannel.onerror = (err) => {
			// 	this.emit('onClose', err);
			// }
			this.peerChannel.onmessage = e => {
				const data = JSON.parse(e.data);
				this.emit('onMessage', { ...data });
			};
		};

		this.peerConnection
			.setRemoteDescription(conf.remoteDescription)
			.then(() => this.peerConnection.createAnswer())
			.then(desc => this.peerConnection.setLocalDescription(desc))
			.then(() => this.emit('onAnswer', this.peerConnection.localDescription))
			.catch(emitError);
	}

	onReady(listener: ReadyEventListener): Disposable {
		return this.on('onReady ', listener);
	}

	onAnswer(listener: AnswerEventListener): Disposable {
		return this.on('onAnswer ', listener);
	}

	sendPayload(payload: Payload): void {
		if (this.peerChannel) {
			this.peerChannel.send(
				JSON.stringify({
					ts: Date.now(),
					...payload,
				})
			);
		}
	}
}
