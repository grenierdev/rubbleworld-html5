import { Server } from '@fexel/core/net/Server';
import { Client } from '@fexel/core/net/Client';
import { WebRTCSignalingFirestore } from '@fexel/core/net/TransportWebRTCSignalingFirestore';
import firebase from 'firebase';

if (firebase.apps.length === 0) {
	firebase.initializeApp({
		apiKey: 'AIzaSyA0l2mTKSNYTdZkXIbFQnGwzYggYZeAzuY',
		authDomain: 'rubble-world.firebaseapp.com',
		databaseURL: 'https://rubble-world.firebaseio.com',
		projectId: 'rubble-world',
		storageBucket: 'rubble-world.appspot.com',
		messagingSenderId: '833301366896',
		appId: '1:833301366896:web:d66e88fdb10ad666',
	});
}

const auth = ((window as any).auth = firebase.auth());
const firestore = firebase.firestore();

const signaler = new WebRTCSignalingFirestore(auth, firestore, 'p2p_rooms');

/**
 *
 */
(window as any).createServer = async (uid: string) => {
	const transport = await signaler.host();
	const server = new Server([transport]);

	server.onClientJoin(client => console.log('[SRV] Join', client));
	server.onClientLeave(client => console.log('[SRV] Leave', client));
	server.onReceive((client, payload) => {
		console.log('[SRV] Receive', client, payload);
		server.broadcastExcept(payload, client);
	});

	return server;
};

/**
 *
 */
(window as any).createClient = async (uid: string) => {
	const transport = await signaler.join(uid);

	const client = new Client(transport);
	client.onConnect(() => console.log('[CLI] Connect'));
	client.onDisconnect(() => console.log('[CLI] Disconnect'));
	client.onReceive(payload => console.log('[CLI] Receive', payload));

	return client;
};
