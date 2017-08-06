
export interface Message {
	type: string
	ts: number
	[payload: string]: any;
}

export interface Payload {
	type: string
	[payload: string]: any;
};