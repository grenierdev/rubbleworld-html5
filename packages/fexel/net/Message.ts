
export interface Payload {
	type: string
	[payload: string]: any;
};

export interface Message extends Payload {
	ts: number
}