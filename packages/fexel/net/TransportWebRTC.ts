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
		public readonly params: WebRTCServerTransportConstructor = {
			label: 'data',
			iceServers: defaultIceServers,
			dataChannelInit: {
				ordered: true,
			},
		}
	) {
		super();
		this.emit('onReady');
	}

	async createOffer(gatherCandidatesTimeout: number = 3000) {
		return new Promise<
			[
				RTCSessionDescriptionInit,
				RTCIceCandidateInit[],
				(answer: RTCSessionDescriptionInit, remoteCandidates: RTCIceCandidateInit[]) => void
			]
		>(async (resolve, reject) => {
			const peerConnection = new RTCPeerConnection({
				iceServers: this.params.iceServers,
			});
			const channel = peerConnection.createDataChannel(this.params.label, this.params.dataChannelInit);

			let offer: RTCSessionDescriptionInit;
			const localCandidates: RTCIceCandidateInit[] = [];
			const answer = async (answer, remoteCandidates) => {
				await peerConnection.setRemoteDescription(answer);
				await Promise.all(remoteCandidates.map(candidate => peerConnection.addIceCandidate(candidate)));
			};

			// peerConnection.onconnectionstatechange = e => console.log('WebRTCServerTransport.onconnectionstatechange', e);
			// peerConnection.onicecandidate = e => console.log('WebRTCServerTransport.onicecandidate', e);
			// peerConnection.onicecandidateerror = e => console.log('WebRTCServerTransport.onicecandidateerror', e);
			// peerConnection.oniceconnectionstatechange = e =>
			// 	console.log('WebRTCServerTransport.oniceconnectionstatechange', e);
			// peerConnection.onnegotiationneeded = e => console.log('WebRTCServerTransport.onnegotiationneeded', e);
			// peerConnection.onsignalingstatechange = e => console.log('WebRTCServerTransport.onsignalingstatechange', e);
			// peerConnection.onstatsended = e => console.log('WebRTCServerTransport.onstatsended', e);
			// peerConnection.ontrack = e => console.log('WebRTCServerTransport.ontrack', e);
			// channel.onopen = e => console.log('WebRTCServerTransport.onopen', e);
			// channel.onclose = e => console.log('WebRTCServerTransport.onclose', e);
			// channel.onerror = e => console.log('WebRTCServerTransport.onerror', e);
			// channel.onmessage = e => console.log('WebRTCServerTransport.onmessage', e);

			peerConnection.addEventListener('icecandidate', ({ candidate }) => {
				if (candidate) {
					localCandidates.push(candidate.toJSON());
				}
			});

			channel.addEventListener('open', _ => {
				const client = new WebRTCServerClient(peerConnection, channel);
				this.emit('onConnect', client);
			});

			const offerInit = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offerInit);
			offer = peerConnection.localDescription!.toJSON();

			setTimeout(() => {
				resolve([offer, localCandidates, answer]);
			}, gatherCandidatesTimeout);
		});
	}
}

export class WebRTCServerClient extends ServerClient {
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

export class WebRTCClientTransport extends ClientTransport {
	static async createTransport(
		offer: RTCSessionDescriptionInit,
		remoteCandidates: RTCIceCandidateInit[],
		params: {
			iceServers: RTCIceServer[];
			gatherCandidatesTimeout: number;
		} = {
			iceServers: defaultIceServers,
			gatherCandidatesTimeout: 3000,
		}
	) {
		return new Promise<[RTCSessionDescriptionInit, RTCIceCandidateInit[], WebRTCClientTransport]>(
			async (resolve, reject) => {
				const peerConnection = new RTCPeerConnection({
					iceServers: params.iceServers,
				});

				let answer: RTCSessionDescriptionInit;
				const localCandidates: RTCIceCandidateInit[] = [];

				// peerConnection.ondatachannel = e => console.log('WebRTCClientTransport.ondatachannel', e);
				// peerConnection.onconnectionstatechange = e => console.log('WebRTCClientTransport.onconnectionstatechange', e);
				// peerConnection.onicecandidate = e => console.log('WebRTCClientTransport.onicecandidate', e);
				// peerConnection.onicecandidateerror = e => console.log('WebRTCClientTransport.onicecandidateerror', e);
				// peerConnection.oniceconnectionstatechange = e =>
				// 	console.log('WebRTCClientTransport.oniceconnectionstatechange', e);
				// peerConnection.onnegotiationneeded = e => console.log('WebRTCClientTransport.onnegotiationneeded', e);
				// peerConnection.onsignalingstatechange = e => console.log('WebRTCClientTransport.onsignalingstatechange', e);
				// peerConnection.onstatsended = e => console.log('WebRTCClientTransport.onstatsended', e);
				// peerConnection.ontrack = e => console.log('WebRTCClientTransport.ontrack', e);

				peerConnection.addEventListener('icecandidate', ({ candidate }) => {
					if (candidate) {
						localCandidates.push(candidate.toJSON());
					}
				});

				await peerConnection.setRemoteDescription(offer);
				await Promise.all(remoteCandidates.map(candidate => peerConnection.addIceCandidate(candidate)));

				if (offer.type === 'offer') {
					const answerInit = await peerConnection.createAnswer();
					await peerConnection.setLocalDescription(answerInit);
					answer = peerConnection.localDescription!.toJSON();
				}

				setTimeout(() => {
					resolve([answer, localCandidates, new WebRTCClientTransport(peerConnection)]);
				}, params.gatherCandidatesTimeout);
			}
		);
	}

	protected channel?: RTCDataChannel;

	constructor(protected readonly connection: RTCPeerConnection) {
		super();

		connection.addEventListener('datachannel', ({ channel }) => {
			this.channel = channel;
			this.channel.addEventListener('message', ({ data }) => {
				this.emit('onReceive', JSON.parse(data));
			});
			this.emit('onConnect');
		});

		connection.addEventListener('connectionstatechange', _ => {
			if (connection.connectionState !== 'connected') {
				this.emit('onDisconnect');
			}
		});
	}

	send(payload: Payload) {
		if (this.channel) {
			this.channel.send(JSON.stringify(payload));
		}
	}
}
