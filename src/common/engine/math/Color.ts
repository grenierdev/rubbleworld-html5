export class Color {
	constructor(public r = 0, public g = 0, public b = 0, public a = 1) {}

	static readonly White = new Color(1, 1, 1);
	static readonly Black = new Color(0, 0, 0);
}

Object.freeze(Color.White);
Object.freeze(Color.Black);
