import { Color } from '../math/Color';
import { Vector3 } from '../math/Vector3';
import { Euler } from '../math/Euler';

export abstract class Light {
	constructor(public intensity: number = 0.5, public color: Color = Color.White.clone()) {}
}

export class DirectionalLight extends Light {
	constructor(public direction: Euler, intensity?: number, color?: Color) {
		super(intensity, color);
	}
}

export class SpotLight extends Light {
	constructor(
		public position: Vector3,
		public direction: Euler,
		public angle: number,
		public range: number,
		intensity?: number,
		color?: Color
	) {
		super(intensity, color);
	}
}

export class PointLight extends Light {
	constructor(public position: Vector3, public range: number, intensity?: number, color?: Color) {
		super(intensity, color);
	}
}
