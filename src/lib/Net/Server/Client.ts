import { EventEmitter } from 'konstellio-eventemitter';

let nextID = 0;

export class Client extends EventEmitter {

	readonly id: string

	constructor () {
		super();

		this.id = (++nextID).toString();


	}

}