import { Component, Scene, UpdateContext } from '../Scene';
import { PriorityList } from '../util/PriorityList';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Material, UniformMap, UniformPrimitive } from '../rendering/Material';
import { Texture } from '../rendering/Texture';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Color, ReadonlyColor } from '../math/Color';
import { ShadowCasterMaterial } from '../materials/ShadowCaster';

export interface RenderContext extends UpdateContext {
	canvas: HTMLCanvasElement;
	gl: WebGLRenderingContext;
}

export interface IRenderable {
	render(width: number, height: number, meshes: PriorityList<IDrawable>, context: RenderContext): void;
}

export interface IDrawable {
	draw(
		gl: WebGLRenderingContext,
		worldMatrix: Matrix4 | ReadonlyMatrix4,
		projectionMatrix: Matrix4 | ReadonlyMatrix4,
		visibilityFlag: number
	): void;
}

export interface LightUniform extends UniformMap {
	Type: number;
	Position: Vector3 | ReadonlyVector3;
	Direction: Vector3 | ReadonlyVector3;
	Color: Color | ReadonlyColor;
	ShadowMap?: Texture;
	ShadowMapMatrix?: Matrix4 | ReadonlyMatrix4;
}

export interface ILight {
	getUniform(): LightUniform | undefined;
	renderShadow(width: number, height: number, meshes: PriorityList<IDrawable>, context: RenderContext): void;
}

export class RendererComponent extends Component {
	public executionOrder = 2000;

	public readonly gl: WebGLRenderingContext;
	public readonly drawables: PriorityList<IDrawable> = new PriorityList();
	public readonly renderables: PriorityList<IRenderable> = new PriorityList();
	public readonly lights: PriorityList<ILight> = new PriorityList();

	public readonly statsData = {
		frames: 0,
		frameCount: 0,
		framePerSecond: 0,
		drawCalls: 0,
		lastFPSUpdate: 0,
	};

	private shadowMaterial = new ShadowCasterMaterial();

	constructor(public readonly canvas: HTMLCanvasElement) {
		super();
		const gl = canvas.getContext('webgl');
		if (!gl) {
			throw new ReferenceError(`Could not get WebGL context of ${canvas}.`);
		}

		this.gl = gl;

		const statsData = this.statsData;
		gl.clear = (function(fn) {
			return function(mask: number) {
				statsData.drawCalls++;
				return fn.call(gl, mask);
			};
		})(gl.clear);
		gl.drawArrays = (function(fn) {
			return function(mode: GLenum, first: GLint, count: GLsizei) {
				statsData.drawCalls++;
				return fn.call(gl, mode, first, count);
			};
		})(gl.drawArrays);
		gl.drawElements = (function(fn) {
			return function(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr) {
				statsData.drawCalls++;
				return fn.call(gl, mode, count, type, offset);
			};
		})(gl.drawElements);
	}

	didMount() {
		if (!(this.entity instanceof Scene)) {
			console.warn('RendererComponent only works on Scene.');
		}
	}

	update(context: UpdateContext) {
		this.statsData.frameCount++;
		this.statsData.frames++;
		this.statsData.drawCalls = 0;

		if (this.entity instanceof Scene) {
			const renderContext = { ...context, canvas: this.canvas, gl: this.gl };
			const width = this.canvas.width;
			const height = this.canvas.height;
			const drawables = this.drawables;

			Material.globals.uLights = [];
			Material.globals.uDirectionalShadowTransform = [];
			Material.globals.uDirectionalShadowMap = [];
			const prevOverride = Material.override;
			Material.override = this.shadowMaterial;

			const lightComponents = this.lights;
			const lights: LightUniform[] = [];
			for (const [light] of lightComponents) {
				light.renderShadow(width, height, drawables, renderContext);
				const uniform = light.getUniform();
				if (uniform) {
					lights.push(uniform);
				}
			}

			for (const light of lights) {
				(Material.globals.uLights as UniformMap[]).push(light);
				if (light.Type === 1) {
					(Material.globals.uDirectionalShadowTransform as UniformPrimitive[]).push(light.ShadowMapMatrix!);
					(Material.globals.uDirectionalShadowMap as UniformPrimitive[]).push(light.ShadowMap!);
				}
			}

			Material.override = prevOverride;

			for (const [renderable] of this.renderables) {
				renderable.render(width, height, drawables, renderContext);
			}
		}

		const time = (performance || Date).now();
		if (time >= this.statsData.lastFPSUpdate + 300) {
			this.statsData.framePerSecond = (this.statsData.frames * 1000) / (time - this.statsData.lastFPSUpdate);
			this.statsData.lastFPSUpdate = time;
			this.statsData.frames = 0;
		}
	}
}
