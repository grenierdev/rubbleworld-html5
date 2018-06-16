import { Disposable } from '@konstellio/disposable';

import { Client } from './Client';
import { Server } from './Server';
import { Payload } from './Message';

export interface ServerWebRTCConf {
	label: string
	maxConnections: number
	servers?: RTCIceServer[]
	channel?: RTCDataChannelInit
}

export type ReadyEventListener = () => void;
export type OfferEventListener = (description: RTCSessionDescription) => void;
export type AnswerEventListener = (description: RTCSessionDescription) => void;

export class ServerWebRTC extends Server {

	public readonly pendingClients: ServerWebRTCClient[]

	constructor(public readonly conf: ServerWebRTCConf = {
		label: "data",
		maxConnections: 1,
		channel: {
			ordered: true
		}
	}) {
		super();

		this.pendingClients = [];
		for (let i = 0; i < conf.maxConnections; ++i) {
			const conn = new RTCPeerConnection({
				iceServers: conf.servers ? conf.servers : [
					{ urls: 'stun:stun.1.google.com:19302' },
					// { urls: 'stun:stun1.l.google.com:19302' },
					// { urls: 'stun:stun2.l.google.com:19302' },
					// { urls: 'stun:stun3.l.google.com:19302' },
					// { urls: 'stun:stun4.l.google.com:19302' },
				]
			});
			const client = new ServerWebRTCClient(conn, conn.createDataChannel(conf.label, conf.channel));

			this.pendingClients.push(client);

			client.onConnect(() => {
				this.clients.push(client);
				this.emit('onClientConnect', client);
			})
			client.onClose((err) => {
				this.clients = [...this.clients.filter(cl => cl !== client)];
				this.emit('onClientDisconnect', client);
			});
			client.onDisconnect(() => {
				this.clients = [...this.clients.filter(cl => cl !== client)];
				this.emit('onClientDisconnect', client);
			});
			client.onMessage((message) => this.emit('onMessage', client, message));
		}
	}

}

export class ServerWebRTCClient extends Client {

	constructor(protected connection: RTCPeerConnection, protected channel: RTCDataChannel) {
		super();

		connection.createOffer().then(desc => {
			connection.setLocalDescription(desc).then(
				() => {
					this.emit('onOffer', connection.localDescription);
				},
				(err) => { }
			);
		});
		connection.onicecandidate = (candidate) => {
			if (candidate === null) {
				this.emit('onReady', connection);
			}
		}
		connection.onicecandidateerror = (e) => {
			console.trace('onicecandidateerror', e);
		}
		connection.onsignalingstatechange = (e) => {
			console.trace('onsignalingstatechange', e);
		}
		connection.oniceconnectionstatechange = (e) => {
			console.trace('oniceconnectionstatechange', e, connection.iceConnectionState);
			switch (connection.iceConnectionState) {
				case "completed":
					this.emit('onConnect');
					break;
				case "disconnected":
					this.emit('onDisconnect');
					break;
				case "closed":
				case "failed":
					this.emit('onClose');
					break;
			}
		}
		connection.onicegatheringstatechange = (e) => {
			console.trace('onicegatheringstatechange', e);
		}

		// channel.onopen = () => {
		// 	this.emit('onConnect');
		// }
		// channel.onerror = (err) => {
		// 	this.emit('onClose', err);
		// }
		channel.onmessage = (e) => {
			const data = JSON.parse(e.data);
			this.emit('onMessage', { ...data });
		}
	}

	setAnswer(answer: RTCSessionDescriptionInit): void {
		this.connection.setRemoteDescription(
			answer,
			() => {
				this.emit('onAnswer', this.connection.remoteDescription);
			},
			(err) => {
				this.emit('onClose', err);
			}
		);
	}

	sendPayload(payload: Payload): void {
		this.channel.send(JSON.stringify({
			ts: Date.now(),
			...payload
		}));
	}

	onReady(listener: ReadyEventListener): Disposable {
		return this.on('onReady ', listener);
	}

	onOffer(listener: OfferEventListener): Disposable {
		return this.on('onOffer ', listener);
	}

	onAnswer(listener: AnswerEventListener): Disposable {
		return this.on('onAnswer ', listener);
	}

}