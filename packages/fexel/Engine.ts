import { IDisposable } from '@konstellio/disposable';
import { Scene, RenderContext } from './Scene';
import { CameraComponent } from './components/Camera';
import { Stats } from './Stats';

export interface EngineStats {
	frames: number;
	drawCalls: number;
	updates: number;
	fixedUpdates: number;
	render: number;
	lastUpdate: number;
}

const HAS_MEMORY = !!(performance as any).memory;

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected renderRequestId: number = -1;
	protected fixedUpdateRequestId: number = -1;
	protected readonly bindedFixedUpdateMethod: () => void;
	protected readonly bindedRenderMethod: () => void;

	public fixedUpdateRate: number = 1000 / 15;
	public readonly gl: WebGLRenderingContext;
	public readonly statsData: EngineStats;

	constructor(protected readonly canvas: HTMLCanvasElement, public readonly stats?: Stats) {
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
		const statsData = (this.statsData = {
			frames: 0,
			drawCalls: 0,
			updates: 0,
			fixedUpdates: 0,
			render: 0,
			lastUpdate: 0,
		});
		this.bindedFixedUpdateMethod = this.fixedUpdate.bind(this);
		this.bindedRenderMethod = this.render.bind(this);

		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

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

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	start() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);
		this.fixedUpdateRequestId = setInterval(this.bindedFixedUpdateMethod, this.fixedUpdateRate);
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
		this.statsData.fixedUpdates = 0;

		if (this.mainScene) {
			const ticker = this.mainScene.fixedUpdate({});
			while (ticker.next().done !== true) {
				this.statsData.fixedUpdates++;
				// TODO bail if frame took too long, emit warning ?
			}
		}

		if (this.stats) {
			this.stats.updateGraph('fixedupdate', this.statsData.fixedUpdates);
		}
	}

	render() {
		this.renderRequestId = requestAnimationFrame(this.bindedRenderMethod);

		this.statsData.frames++;
		this.statsData.drawCalls = this.statsData.updates = this.statsData.render = 0;

		const startTime = (performance || Date).now();

		if (this.mainScene) {
			const gl = this.gl;
			const width = this.canvas.width;
			const height = this.canvas.height;

			const ticker = this.mainScene.update({});
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
				const [viewMatrix, projectionMatrix] = cameraComponent.setupViewport(gl, width, height);
				const context: RenderContext = {
					gl,
					viewMatrix,
					projectionMatrix,
				};
				const ticker = this.mainScene.render(context);
				while (ticker.next().done !== true) {
					this.statsData.render++;
					// TODO bail if frame took too long, emit warning ?
				}
			}

			gl.flush();
		}
		if (this.stats) {
			const time = (performance || Date).now();
			if (time >= this.statsData.lastUpdate + 1000) {
				this.stats.updateGraph(
					'fps',
					+((this.statsData.frames * 1000) / (time - this.statsData.lastUpdate)).toFixed(0)
				);
				this.statsData.lastUpdate = time;
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

	loadScene(scene: Scene) {
		// TODO Unload last scene ?
		this.mainScene = scene;
	}
}
