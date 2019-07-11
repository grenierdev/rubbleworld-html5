import { IDisposable } from '@konstellio/disposable';

import { Material } from './rendering/Material';
import { Texture } from './rendering/Texture';
import { Scene, Component } from './Scene';
import { CameraComponent } from './components/Camera';
import { MeshRendererComponent } from './components/MeshRenderer';

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected renderRequestId: number = -1;
	protected updateRequestId: number = -1;
	protected readonly bindedUpdateMethod: () => void;
	protected readonly bindedRenderMethod: () => void;
	protected cameraComponents: CameraComponent[] = [];

	public frameRate: number = 1000 / 30;
	public readonly gl: WebGLRenderingContext;

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
		this.bindedUpdateMethod = this.update.bind(this);
		this.bindedRenderMethod = this.render.bind(this);

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
	}

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	start() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);
		this.updateRequestId = setInterval(this.bindedUpdateMethod, this.frameRate);
	}

	stop() {
		if (this.renderRequestId > -1) {
			cancelAnimationFrame(this.renderRequestId);
			this.renderRequestId = -1;
		}
		if (this.updateRequestId > -1) {
			clearInterval(this.updateRequestId);
			this.updateRequestId = -1;
		}
	}

	update() {
		if (this.mainScene) {
			this.cameraComponents.splice(0, this.cameraComponents.length);
			const ticker = this.mainScene.update();
			let result: IteratorResult<Component>;
			while ((result = ticker.next()).done !== true) {
				const component = result.value;
				if (component instanceof CameraComponent) {
					this.cameraComponents.push(component);
				}
				// TODO bail if frame took too long, emit warning ?
			}
		}
	}

	render() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);

		if (this.mainScene) {
			const gl = this.gl;
			const width = this.canvas.width;
			const height = this.canvas.height;

			for (const cameraComponent of this.cameraComponents) {
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

				const meshRendererComponents: MeshRendererComponent[] = [];
				const ticker = this.mainScene.render(cameraComponent);
				let result: IteratorResult<Component>;
				while ((result = ticker.next()).done !== true) {
					const component = result.value;
					if (component instanceof MeshRendererComponent) {
						meshRendererComponents.push(component);
					}
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
		}
	}

	loadScene(scene: Scene) {
		this.cameraComponents = [];
		// TODO Unload last scene ?
		this.mainScene = scene;
	}
}
