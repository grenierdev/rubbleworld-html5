import { Component, UpdateContext } from '../Scene';
import { TransformComponent } from './Transform';
import { Mutable } from '../util/Immutable';
import { Light, DirectionalLight, SpotLight, PointLight } from '../rendering/Light';
import { Color } from '../math/Color';
import { Euler } from '../math/Euler';
import { Vector3 } from '../math/Vector3';
import { Matrix4 } from '../math/Matrix4';
import { DEG2RAD } from '../math/util';
import { RendererComponent, IDrawable, LightUniform } from './Renderer';
import { PriorityList } from '../util/PriorityList';

export abstract class LightComponent extends Component {
	public readonly transform: TransformComponent | undefined;
	protected renderer: RendererComponent | undefined;

	constructor(public readonly light: Light, public castShadow: boolean = false) {
		super();
	}

	didMount() {
		(this as Mutable<LightComponent>).transform = this.getComponent(TransformComponent);

		const scene = this.entity!.scene;
		this.renderer = scene ? scene.getComponent(RendererComponent) : undefined;
		if (this.renderer) {
			this.renderer.lights.add(this, 0);
		}
	}

	willUnmount() {
		if (this.renderer) {
			this.renderer.lights.remove(this);
		}
	}

	abstract getUniform(): LightUniform | undefined;

	render(width: number, height: number, meshes: PriorityList<IDrawable>, context: UpdateContext) {}
}

export interface DirectionalLightConstructor {
	direction: Euler;
	intensity?: number;
	color?: Color;
	near?: number;
	far?: number;
}

export class DirectionalLightComponent extends LightComponent {
	protected readonly projectionMatrix: Matrix4 = new Matrix4();

	constructor({ direction, intensity, color }: DirectionalLightConstructor, public near = 0.01, public far = 2000) {
		super(new DirectionalLight(direction, intensity, color));
	}

	updateProjectionMatrix() {
		const light = this.light as DirectionalLight;
		this.projectionMatrix.makeOrthographic(-1, 1, -1, 1, this.near, this.far);
	}

	getUniform() {
		const light = this.light as DirectionalLight;
		const uniform: LightUniform = {
			type: 0,
			position: [0, 0, 0],
			direction: [light.direction.x, light.direction.y, light.direction.z],
			intensity: light.intensity,
			color: [light.color.r, light.color.g, light.color.b],
		};
		return uniform;
	}
}

export interface SpotConstructorLight {
	angle: number;
	range: number;
	intensity?: number;
	color?: Color;
}

export class SpotComponentLight extends LightComponent {
	protected readonly projectionMatrix: Matrix4 = new Matrix4();

	constructor({ angle, range, intensity, color }: SpotConstructorLight, public near = 0.01, public far = 2000) {
		super(new SpotLight(Vector3.Zero.clone(), Euler.Zero.clone(), angle, range, intensity, color));
	}

	updateProjectionMatrix() {
		const light = this.light as SpotLight;
		const near = this.near;
		const top = near * Math.tan(DEG2RAD * light.angle);
		const height = top * 2;
		const width = height;
		const left = width * -0.5;

		this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far);
	}

	getUniform() {
		return undefined;
	}
}

export interface PointConstructorLight {
	range: number;
	intensity?: number;
	color?: Color;
}

export class PointComponentLight extends LightComponent {
	constructor({ range, intensity, color }: PointConstructorLight) {
		super(new PointLight(Vector3.Zero.clone(), range, intensity, color));
	}

	getUniform() {
		return undefined;
	}
}
