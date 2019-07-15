export class Color {
	constructor(public r = 0, public g = 0, public b = 0, public a = 1) {}

	equals(color: Color | ReadonlyColor) {
		return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
	}

	clone() {
		return new Color(this.r, this.g, this.b, this.a);
	}

	static readonly White: ReadonlyColor = new Color(1, 1, 1);
	static readonly Black: ReadonlyColor = new Color(0, 0, 0);
}

export type ReadonlyColor = Pick<Color, 'equals' | 'clone'> & {
	readonly r: number;
	readonly g: number;
	readonly b: number;
	readonly a: number;
};

Object.freeze(Color.White);
Object.freeze(Color.Black);
