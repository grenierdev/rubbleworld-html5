import { IDisposable } from '@konstellio/disposable';
import { Scene, RenderContext } from './Scene';
import { CameraComponent } from './components/Camera';
import { Stats } from './Stats';
import { Debug } from './Debug';

export interface EngineStats {
	frameCount: number;
	frames: number;
	drawCalls: number;
	updates: number;
	fixedUpdates: number;
	render: number;
	lastFPSUpdate: number;
	lastUpdateTime: number;
	lastFixedUpdateTime: number;
}

const HAS_MEMORY = !!(performance as any).memory;

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected updateRequestId: number = -1;
	protected fixedUpdateRequestId: number = -1;
	protected readonly bindedUpdateMethod: () => void;
	protected readonly bindedFixedUpdateMethod: () => void;

	public fixedUpdateRate: number = 1000 / 15;
	public readonly statsData: EngineStats;

	constructor() {
		this.statsData = {
			frameCount: 0,
			frames: 0,
			drawCalls: 0,
			updates: 0,
			fixedUpdates: 0,
			render: 0,
			lastFPSUpdate: 0,
			lastUpdateTime: 0,
			lastFixedUpdateTime: 0,
		};
		this.bindedUpdateMethod = this.update.bind(this);
		this.bindedFixedUpdateMethod = this.fixedUpdate.bind(this);
	}

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	loadScene(scene: Scene) {
		// TODO Unload last scene ?
		this.mainScene = scene;
	}

	start() {
		this.updateRequestId = setInterval(this.bindedUpdateMethod, this.fixedUpdateRate);
		this.fixedUpdateRequestId = setInterval(this.bindedFixedUpdateMethod, this.fixedUpdateRate);
	}

	stop() {
		if (this.updateRequestId > -1) {
			clearInterval(this.updateRequestId);
			this.updateRequestId = -1;
		}
		if (this.fixedUpdateRequestId > -1) {
			clearInterval(this.fixedUpdateRequestId);
			this.fixedUpdateRequestId = -1;
		}
	}

	update() {
		this.statsData.updates = 0;

		if (this.mainScene) {
			const time = (performance || Date).now();
			const deltaTime = time - this.statsData.lastUpdateTime;
			this.statsData.lastUpdateTime = time;

			const ticker = this.mainScene.update({
				time,
				deltaTime,
				timeScale: 1,
				frameCount: 0,
			});
			while (ticker.next().done !== true) {
				this.statsData.updates++;
				// TODO bail if frame took too long, emit warning ?
			}
		}
	}

	fixedUpdate() {
		this.statsData.fixedUpdates = 0;

		if (this.mainScene) {
			const time = (performance || Date).now();
			const deltaTime = time - this.statsData.lastFixedUpdateTime;
			this.statsData.lastFixedUpdateTime = time;

			const ticker = this.mainScene.fixedUpdate({
				time,
				deltaTime,
				timeScale: 1,
			});
			while (ticker.next().done !== true) {
				this.statsData.fixedUpdates++;
				// TODO bail if frame took too long, emit warning ?
			}
		}
	}
}

export class RenderableEngine extends Engine {
	protected renderRequestId: number = -1;

	public readonly gl: WebGLRenderingContext;
	public readonly debug: Debug;

	constructor(protected readonly canvas: HTMLCanvasElement, public readonly stats?: Stats) {
		super();

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
		this.debug = new Debug();

		const statsData = this.statsData;
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

		if (stats) {
			stats.addGraph({ id: 'fps', label: 'fps', min: 0, max: 60 });
			stats.addGraph({ id: 'ms', label: 'ms', min: 0, max: 50 });
			if (HAS_MEMORY) {
				stats.addGraph({ id: 'mem', label: 'Mb', min: 0, max: (performance as any).memory.jsHeapSizeLimit / 1048576 });
			}
			stats.addGraph({ id: 'update', label: ' updates', min: 0, max: 50 });
			stats.addGraph({ id: 'render', label: ' renders', min: 0, max: 50 });
			stats.addGraph({ id: 'fixedupdate', label: ' fupdates', min: 0, max: 50 });
			stats.addGraph({ id: 'draw', label: ' draws', min: 0, max: 20 });
		}
	}

	start() {
		this.updateRequestId = requestAnimationFrame(this.bindedUpdateMethod);
		this.fixedUpdateRequestId = setInterval(this.bindedFixedUpdateMethod, this.fixedUpdateRate);
	}

	stop() {
		if (this.updateRequestId > -1) {
			cancelAnimationFrame(this.updateRequestId);
			this.updateRequestId = -1;
		}
		if (this.fixedUpdateRequestId > -1) {
			clearInterval(this.fixedUpdateRequestId);
			this.fixedUpdateRequestId = -1;
		}
	}

	update() {
		this.updateRequestId = requestAnimationFrame(this.bindedUpdateMethod);

		this.statsData.frameCount++;
		this.statsData.frames++;
		this.statsData.drawCalls = this.statsData.updates = this.statsData.render = 0;

		const startTime = (performance || Date).now();

		if (this.mainScene) {
			const gl = this.gl;
			const width = this.canvas.width;
			const height = this.canvas.height;
			const time = startTime;
			const deltaTime = time - this.statsData.lastUpdateTime;
			this.statsData.lastUpdateTime = time;

			const ticker = this.mainScene.update({
				time,
				deltaTime,
				timeScale: 1,
				frameCount: this.statsData.frameCount,
				debug: this.debug,
			});
			while (ticker.next().done !== true) {
				this.statsData.updates++;
				// TODO bail if frame took too long, emit warning ?
			}

			const cameraComponents: CameraComponent[] = [];
			for (const component of this.mainScene.updatableComponents) {
				if (component instanceof CameraComponent) {
					cameraComponents.push(component);
				}
			}

			for (const cameraComponent of cameraComponents) {
				cameraComponent.draw({
					width,
					height,
					context: {
						gl,
						time,
						deltaTime,
						timeScale: 1,
						frameCount: this.statsData.frameCount,
						debug: this.debug,
					},
					renderScene: context => {
						const ticker = this.mainScene!.render(context);
						while (ticker.next().done !== true) {
							this.statsData.render++;
							// TODO bail if frame took too long, emit warning ?
						}
					},
				});
			}

			gl.flush();
		}

		if (this.debug) {
			this.debug.update();
		}

		if (this.stats) {
			const time = (performance || Date).now();
			if (time >= this.statsData.lastFPSUpdate + 300) {
				this.stats.updateGraph(
					'fps',
					+((this.statsData.frames * 1000) / (time - this.statsData.lastFPSUpdate)).toFixed(0)
				);
				this.statsData.lastFPSUpdate = time;
				this.statsData.frames = 0;
			}
			this.stats.updateGraph('ms', +(time - startTime).toFixed(1));
			if (HAS_MEMORY) {
				this.stats.updateGraph('mem', +((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1));
			}
			this.stats.updateGraph('update', this.statsData.updates);
			this.stats.updateGraph('render', this.statsData.render);
			this.stats.updateGraph('draw', this.statsData.drawCalls);
		}
	}

	fixedUpdate() {
		super.fixedUpdate();

		if (this.stats) {
			this.stats.updateGraph('fixedupdate', this.statsData.fixedUpdates);
		}
	}
}
