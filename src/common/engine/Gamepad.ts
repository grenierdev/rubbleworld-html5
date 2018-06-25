
export abstract class Gamepad {
	public static gamepad: Gamepad[] = [];

	constructor() {

	}

	abstract getButton(button: string): boolean;
	abstract getButtonDown(button: string): boolean;
	abstract getAxis(axe: string): number;
}