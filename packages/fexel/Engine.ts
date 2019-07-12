import { IDisposable } from '@konstellio/disposable';
import { Scene, Component } from './Scene';
import { CameraComponent } from './components/Camera';
import { MeshRendererComponent } from './components/MeshRenderer';

export interface EngineStats {
	drawCalls: number;
	updates: number;
	fixedUpdates: number;
	render: number;
}

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected renderRequestId: number = -1;
	protected fixedUpdateRequestId: number = -1;
	protected readonly bindedFixedUpdateMethod: () => void;
	protected readonly bindedRenderMethod: () => void;

	public fixedUpdateRate: number = 1000 / 15;
	public readonly gl: WebGLRenderingContext;
	public readonly stats: EngineStats;

	constructor(protected readonly canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl', {
			alpha: false,
			antialias: false,
			depth: true,
			stencil: false,
		});

		if (!gl) {
			throw new ReferenceError(`Could not get WebGL context out of ${canvas}.`);
		}

		this.gl = gl;
		const stats = (this.stats = {
			drawCalls: 0,
			updates: 0,
			fixedUpdates: 0,
			render: 0,
		});
		this.bindedFixedUpdateMethod = this.fixedUpdate.bind(this);
		this.bindedRenderMethod = this.render.bind(this);

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		gl.drawArrays = (function(fn) {
			return function(mode: GLenum, first: GLint, count: GLsizei) {
				stats.drawCalls++;
				return fn.call(gl, mode, first, count);
			};
		})(gl.drawArrays);
		gl.drawElements = (function(fn) {
			return function(
				mode: GLenum,
				count: GLsizei,
				type: GLenum,
				offset: GLintptr
			) {
				stats.drawCalls++;
				return fn.call(gl, mode, count, type, offset);
			};
		})(gl.drawElements);
	}

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	start() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);
		this.fixedUpdateRequestId = setInterval(
			this.bindedFixedUpdateMethod,
			this.fixedUpdateRate
		);
	}

	stop() {
		if (this.renderRequestId > -1) {
			cancelAnimationFrame(this.renderRequestId);
			this.renderRequestId = -1;
		}
		if (this.fixedUpdateRequestId > -1) {
			clearInterval(this.fixedUpdateRequestId);
			this.fixedUpdateRequestId = -1;
		}
	}

	fixedUpdate() {
		this.stats.fixedUpdates = 0;
	}

	render() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);

		this.stats.drawCalls = this.stats.updates = this.stats.render = 0;

		if (this.mainScene) {
			const gl = this.gl;
			const width = this.canvas.width;
			const height = this.canvas.height;

			const ticker = this.mainScene.update();
			while (ticker.next().done !== true) {
				this.stats.updates++;
				// TODO bail if frame took too long, emit warning ?
			}

			const cameraComponents: CameraComponent[] = [];
			const meshRendererComponents: MeshRendererComponent[] = [];
			for (const component of this.mainScene.everyComponentsInTree) {
				if (component instanceof CameraComponent) {
					cameraComponents.push(component);
				} else if (component instanceof MeshRendererComponent) {
					meshRendererComponents.push(component);
				}
			}

			for (const cameraComponent of cameraComponents) {
				gl.viewport(
					cameraComponent.viewport.min.x * width,
					cameraComponent.viewport.min.y * height,
					(cameraComponent.viewport.max.x - cameraComponent.viewport.min.x) *
						width,
					(cameraComponent.viewport.max.y - cameraComponent.viewport.min.y) *
						height
				);
				if (cameraComponent.clear) {
					gl.clearColor(
						cameraComponent.backgroundColor.r,
						cameraComponent.backgroundColor.g,
						cameraComponent.backgroundColor.b,
						cameraComponent.backgroundColor.a
					);
					gl.clear(cameraComponent.clear);
				}

				const meshRendererComponents = this.mainScene.everyComponentsInTree.filter(
					(component): component is MeshRendererComponent =>
						component instanceof MeshRendererComponent
				);
				const ticker = this.mainScene.render(cameraComponent);
				while (ticker.next().done !== true) {
					this.stats.render++;
					// TODO bail if frame took too long, emit warning ?
				}

				meshRendererComponents.sort(
					(a, b) => a.material.queue - b.material.queue
				);

				for (const meshRendererComponent of meshRendererComponents) {
					meshRendererComponent.material.bind(gl);
					meshRendererComponent.mesh.draw(gl);
				}
			}

			gl.flush();
			console.log(this.stats.drawCalls, this.stats.updates, this.stats.render);
		}
	}

	loadScene(scene: Scene) {
		// TODO Unload last scene ?
		this.mainScene = scene;
	}
}
