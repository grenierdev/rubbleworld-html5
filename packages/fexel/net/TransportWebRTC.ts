import { ServerTransport, ServerClient } from './Server';
import { Payload } from './Payload';
import { ClientTransport } from './Client';

// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ServerWebRTC.ts
// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ClientWebRTC.ts

export interface WebRTCServerTransportConstructor {
	label: string;
	servers?: RTCIceServer[];
	channel?: RTCDataChannelInit;
}

const defaultIceServers = [
	{ urls: 'stun:stun.1.google.com:19302' },
	// { urls: 'stun:stun1.l.google.com:19302' },
	// { urls: 'stun:stun2.l.google.com:19302' },
	// { urls: 'stun:stun3.l.google.com:19302' },
	// { urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCServerTransport extends ServerTransport {
	constructor(public readonly params: WebRTCServerTransportConstructor) {
		super();
	}

	async createInvite() {
		const peerConnection = new RTCPeerConnection({
			iceServers: this.params.servers ? this.params.servers : defaultIceServers,
		});

		const description = await peerConnection
			.createOffer()
			.then(desc => peerConnection.setLocalDescription(desc).then(() => peerConnection.localDescription!));

		const invite = new WebRTCServerInvite(
			peerConnection,
			description,
			() => {
				const client = new WebRTCServerClient(peerConnection, this.params.label, this.params.channel);
				this.emit('onConnect', client);
			},
			() => {}
		);

		return invite;
	}
}

export class WebRTCServerInvite {
	constructor(
		protected readonly connection: RTCPeerConnection,
		public readonly description: RTCSessionDescription,
		protected readonly onAccept: () => void,
		protected readonly onError: () => void
	) {
		connection.onicecandidate = e => {
			console.trace('onicecandidate', e);
		};
		connection.onicecandidateerror = e => {
			console.trace('onicecandidateerror', e);
		};
		connection.onsignalingstatechange = e => {
			console.trace('onsignalingstatechange', e);
		};
		connection.onicegatheringstatechange = e => {
			console.trace('onicegatheringstatechange', e);
		};
		connection.oniceconnectionstatechange = e => {
			console.trace('oniceconnectionstatechange', e);
			debugger;
			switch (connection.iceConnectionState) {
				case 'completed':
					this.onAccept();
					break;
				case 'disconnected':
				case 'closed':
				case 'failed':
					this.onError();
					break;
			}
		};
	}

	async accept(answer: RTCSessionDescription) {
		await this.connection.setRemoteDescription(
			answer,
			() => console.log('Invite.accept RemoteDescription', this.connection.remoteDescription),
			err => console.trace('Invite.accept Error', err)
		);
	}
}

export class WebRTCServerClient extends ServerClient {
	protected readonly channel: RTCDataChannel;
	constructor(
		protected readonly connection: RTCPeerConnection,
		protected readonly label: string,
		protected readonly channelInit?: RTCDataChannelInit
	) {
		super();

		this.channel = connection.createDataChannel(label, channelInit);

		this.channel.onerror = err => {
			this.emit('onDisconnect');
		};
		this.channel.onmessage = event => {
			const data = JSON.parse(event.data);
			this.emit('onReceive', { ...data });
		};
	}

	send(payload: Payload) {
		this.channel.send(JSON.stringify(payload));
	}
}

export interface WebRTCClientTransportConstructor {
	description: RTCSessionDescriptionInit;
	onAnswer: (description: RTCSessionDescription) => void;
	servers?: RTCIceServer[];
}

export class WebRTCClientTransport extends ClientTransport {
	static createTransport({ description, onAnswer, servers }: WebRTCClientTransportConstructor) {
		return new Promise<WebRTCClientTransport>(async (resolve, reject) => {
			const peerConnection = new RTCPeerConnection({
				iceServers: servers ? servers : defaultIceServers,
			});

			peerConnection.oniceconnectionstatechange = e => {
				switch (peerConnection.iceConnectionState) {
					case 'connected':
						// this.emit('onConnect');
						break;
					case 'disconnected':
					case 'closed':
					case 'failed':
						reject();
						break;
				}
			};

			peerConnection.ondatachannel = ({ channel }) => {
				resolve(new WebRTCClientTransport(peerConnection, channel));
			};

			await peerConnection.setRemoteDescription(description);
			const answer = await peerConnection.createAnswer().then(async description => {
				await peerConnection.setLocalDescription(description);
				return peerConnection.localDescription!;
			});

			onAnswer(answer);
		});
	}

	constructor(protected readonly connection: RTCPeerConnection, protected readonly channel: RTCDataChannel) {
		super();

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
}
