
export interface Message {
	type: string
	ts: number
}

export interface Payload {
	type: string
	[payload: string]: any;
};