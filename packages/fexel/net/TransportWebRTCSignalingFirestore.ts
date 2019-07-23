import { auth, firestore } from 'firebase/app';
import { WebRTCServerTransport, WebRTCClientTransport } from './TransportWebRTC';
import { IDisposable, CompositeDisposable, Disposable } from '@konstellio/disposable';

export class WebRTCSignalingFirestore implements IDisposable {
	protected readonly janitor = new CompositeDisposable();
	constructor(
		public readonly auth: auth.Auth,
		public readonly database: firestore.Firestore,
		public readonly collection: string
	) {}

	isDisposed() {
		return this.janitor.isDisposed();
	}

	dispose() {
		return this.janitor.dispose();
	}

	async host() {
		if (!this.auth.currentUser) {
			throw new Error(`You should log in first`);
		}
		const transport = new WebRTCServerTransport();
		const roomRef = this.database.collection(this.collection).doc(this.auth.currentUser.uid);
		await roomRef.set({ ttl: Date.now() / 1000 + 24 * 60 * 60 }, { merge: true });

		const requests: Map<
			string,
			(answer: RTCSessionDescriptionInit, remoteCandidates: RTCIceCandidateInit[]) => void
		> = new Map();

		const requestRef = roomRef.collection('requests');
		const unsubscribe = requestRef.onSnapshot(
			async snapshot => {
				for (const document of snapshot.docs) {
					const data = { ...document.data() } as any;
					switch (data.type) {
						case 'request':
							const [offer, candidates, accept] = await transport.createOffer();
							requests.set(document.id, accept);
							await document.ref.set({ type: 'offer', offer, candidates });
							break;
						case 'answer':
							const request = requests.get(document.id);
							if (request) {
								request(data.answer, data.candidates);
								await document.ref.set({ type: 'completed' });
								requests.delete(document.id);
							}
					}
				}
			},
			error => {
				console.error('Requests error', error);
			}
		);

		this.janitor.add(new Disposable(() => unsubscribe()));

		return transport;
	}

	async join(uid: string) {
		return new Promise<WebRTCClientTransport>(async (resolve, reject) => {
			if (!this.auth.currentUser) {
				throw new Error(`You should log in first`);
			}

			const requestRef = this.database.collection(`${this.collection}/${uid}/requests`).doc(this.auth.currentUser.uid);
			const unsubscribe = requestRef.onSnapshot(
				async document => {
					const data = { type: 'request', ...document.data() } as any;
					switch (data.type) {
						case 'request':
							// noop;
							break;
						case 'offer':
							try {
								const [answer, candidates, transport] = await WebRTCClientTransport.createTransport(
									data.offer,
									data.candidates
								);
								unsubscribe();
								await requestRef.set({ type: 'answer', answer, candidates });
								resolve(transport);
							} catch (error) {
								unsubscribe();
								await requestRef.set({ type: 'error', error });
								reject(error);
							}
							break;
					}
				},
				error => reject(error)
			);

			await requestRef.set({ type: 'request' });
		});
	}
}
