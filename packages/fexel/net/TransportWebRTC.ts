import { ServerTransport, ServerClient } from './Server';
import { Payload } from './Payload';
import { ClientTransport } from './Client';

// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ServerWebRTC.ts
// https://github.com/grenierdev/rubbleworld-html5/blob/proto2/packages/fexel/net/ClientWebRTC.ts

export interface WebRTCServerTransportConstructor {
	label: string;
	iceServers?: RTCIceServer[];
	dataChannelInit?: RTCDataChannelInit;
}

const defaultIceServers = [
	{ urls: 'stun:stun.1.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' },
	{ urls: 'stun:stun2.l.google.com:19302' },
	{ urls: 'stun:stun3.l.google.com:19302' },
	{ urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCServerTransport extends ServerTransport {
	constructor(
		public readonly defaultConstructor: WebRTCServerTransportConstructor = {
			label: 'data',
			iceServers: defaultIceServers,
			dataChannelInit: {
				ordered: true,
			},
		}
	) {
		super();
	}
	async createInvite(
		onOffer: (description: RTCSessionDescription) => void,
		onCandidate: (candidate: RTCIceCandidate) => void
	) {
		const peerConnection = new RTCPeerConnection({
			iceServers: (this.defaultConstructor && this.defaultConstructor.iceServers) || defaultIceServers,
		});

		const channel = peerConnection.createDataChannel(
			(this.defaultConstructor && this.defaultConstructor.label) || 'data',
			this.defaultConstructor && this.defaultConstructor.dataChannelInit
		);
		channel.onopen = e => console.log('WebRTCServerTransport.onopen', e);
		channel.onclose = e => console.log('WebRTCServerTransport.onclose', e);
		channel.onerror = e => console.log('WebRTCServerTransport.onerror', e);
		channel.onmessage = e => console.log('WebRTCServerTransport.onmessage', e);
		console.log('WebRTCServerTransport.channel', channel);

		peerConnection.onconnectionstatechange = e => console.log('WebRTCServerTransport.onconnectionstatechange', e);
		peerConnection.onicecandidate = e => console.log('WebRTCServerTransport.onicecandidate', e);
		peerConnection.onicecandidateerror = e => console.log('WebRTCServerTransport.onicecandidateerror', e);
		peerConnection.oniceconnectionstatechange = e => console.log('WebRTCServerTransport.oniceconnectionstatechange', e);
		peerConnection.onnegotiationneeded = e => console.log('WebRTCServerTransport.onnegotiationneeded', e);
		peerConnection.onsignalingstatechange = e => console.log('WebRTCServerTransport.onsignalingstatechange', e);
		peerConnection.onstatsended = e => console.log('WebRTCServerTransport.onstatsended', e);
		peerConnection.ontrack = e => console.log('WebRTCServerTransport.ontrack', e);

		peerConnection.addEventListener('icecandidate', ({ candidate }) => {
			if (candidate) {
				onCandidate(candidate);
			}
		});

		await peerConnection.createOffer().then(offerInit =>
			peerConnection.setLocalDescription(offerInit).then(() => {
				console.log('WebRTCServerTransport.offer', peerConnection.localDescription!);
				onOffer(peerConnection.localDescription!);
			})
		);

		return async (answer: RTCSessionDescriptionInit, candidates: RTCIceCandidate[]) => {
			console.log('WebRTCServerTransport.answer', answer);
			await peerConnection.setRemoteDescription(answer);
			await Promise.all(candidates.map(candidate => peerConnection.addIceCandidate(candidate)));
			// await peerConnection.addIceCandidate(candidate);
		};
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

export class WebRTCClientTransport extends ClientTransport {
	static async createTransport(
		offer: RTCSessionDescriptionInit,
		candidates: RTCIceCandidateInit[],
		onAnswer: (answer: RTCSessionDescription) => void,
		onCandidate: (candidate: RTCIceCandidate) => void,
		iceServers: RTCIceServer[] = defaultIceServers
	) {
		const peerConnection = new RTCPeerConnection({
			iceServers,
		});

		peerConnection.ondatachannel = e => console.log('WebRTCClientTransport.ondatachannel', e);
		peerConnection.onconnectionstatechange = e => console.log('WebRTCClientTransport.onconnectionstatechange', e);
		peerConnection.onicecandidate = e => console.log('WebRTCClientTransport.onicecandidate', e);
		peerConnection.onicecandidateerror = e => console.log('WebRTCClientTransport.onicecandidateerror', e);
		peerConnection.oniceconnectionstatechange = e => console.log('WebRTCClientTransport.oniceconnectionstatechange', e);
		peerConnection.onnegotiationneeded = e => console.log('WebRTCClientTransport.onnegotiationneeded', e);
		peerConnection.onsignalingstatechange = e => console.log('WebRTCClientTransport.onsignalingstatechange', e);
		peerConnection.onstatsended = e => console.log('WebRTCClientTransport.onstatsended', e);
		peerConnection.ontrack = e => console.log('WebRTCClientTransport.ontrack', e);

		peerConnection.addEventListener('icecandidate', ({ candidate }) => {
			if (candidate) {
				onCandidate(candidate);
			}
		});

		await peerConnection.setRemoteDescription(offer);
		await Promise.all(candidates.map(candidate => peerConnection.addIceCandidate(candidate)));
		// await peerConnection.addIceCandidate(candidate);

		if (offer.type === 'offer') {
			const answerInit = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answerInit);
			console.log('WebRTCClientTransport.answer', peerConnection.localDescription!);
			onAnswer(peerConnection.localDescription!);
		}
	}

	constructor(protected readonly connection: RTCPeerConnection, protected readonly channel: RTCDataChannel) {
		super();

		connection.addEventListener('connectionstatechange', _ => {
			if (connection.connectionState !== 'connected') {
				this.emit('onDisconnect');
			}
		});

		channel.addEventListener('message', ({ data }) => {
			this.emit('onReceive', JSON.parse(data));
		});
	}

	send(payload: Payload) {
		this.channel.send(JSON.stringify(payload));
	}
}

// export class WebRTCClientTransport extends ClientTransport {
// 	static createTransport({ description, onAnswer, servers }: WebRTCClientTransportConstructor) {
// 		return new Promise<WebRTCClientTransport>(async (resolve, reject) => {
// 			const peerConnection = new RTCPeerConnection({
// 				iceServers: servers ? servers : defaultIceServers,
// 			});

// 			peerConnection.oniceconnectionstatechange = e => {
// 				switch (peerConnection.iceConnectionState) {
// 					case 'connected':
// 						// this.emit('onConnect');
// 						break;
// 					case 'disconnected':
// 					case 'closed':
// 					case 'failed':
// 						reject();
// 						break;
// 				}
// 			};

// 			peerConnection.ondatachannel = ({ channel }) => {
// 				resolve(new WebRTCClientTransport(peerConnection, channel));
// 			};

// 			await peerConnection.setRemoteDescription(description);
// 			const answer = await peerConnection.createAnswer().then(async description => {
// 				await peerConnection.setLocalDescription(description);
// 				return peerConnection.localDescription!;
// 			});

// 			onAnswer(answer);
// 		});
// 	}

// 	constructor(protected readonly connection: RTCPeerConnection, protected readonly channel: RTCDataChannel) {
// 		super();

// 		// channel.onopen = () => {
// 		// 	this.emit('onConnect');
// 		// }
// 		// channel.onerror = (err) => {
// 		// 	this.emit('onClose', err);
// 		// }
// 		channel.onmessage = e => {
// 			const data = JSON.parse(e.data);
// 			this.emit('onReceive', { ...data });
// 		};
// 	}

// 	send(payload: Payload) {
// 		this.channel.send(JSON.stringify(payload));
// 	}
// }
