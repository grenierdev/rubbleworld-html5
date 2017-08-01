
export interface Message {
	type: string
	ts: number
}

export interface MessagePayload {
	type: string
	[payload: string]: any;
};