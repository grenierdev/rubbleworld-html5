import { IDisposable } from '@konstellio/disposable';
import { Scene, UpdateContext } from './Scene';
import { Debug } from './Debug';
import { Stats } from './Stats';
import { RendererComponent } from './components/Renderer';

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected updateRequestId: number = -1;
	protected fixedUpdateRequestId: number = -1;
	protected readonly bindedUpdateMethod: (context?: Partial<UpdateContext>) => void;
	protected readonly bindedFixedUpdateMethod: (context?: Partial<UpdateContext>) => void;

	public fixedUpdateRate: number = 1000 / 15;
	public readonly statsData = {
		updates: 0,
		fixedUpdates: 0,
		lastUpdateTime: 0,
		lastFixedUpdateTime: 0,
	};

	constructor() {
		this.bindedUpdateMethod = this.update.bind(this);
		this.bindedFixedUpdateMethod = this.fixedUpdate.bind(this);
	}

	async dispose() {}

	isDisposed() {
		return false;
	}

	loadScene(scene: Scene) {
		// TODO Unload last scene ?
		this.mainScene = scene;
	}

	start() {
		this.updateRequestId = setInterval(this.bindedUpdateMethod, this.fixedUpdateRate) as any;
		this.fixedUpdateRequestId = setInterval(this.bindedFixedUpdateMethod, this.fixedUpdateRate) as any;
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

	update(context?: Partial<UpdateContext>) {
		this.statsData.updates = 0;

		if (this.mainScene) {
			const time = (performance || Date).now();
			const deltaTime = time - this.statsData.lastUpdateTime;
			this.statsData.lastUpdateTime = time;

			const ticker = this.mainScene.update({
				...context,
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

const HAS_MEMORY = !!(performance as any).memory;

export class RenderableEngine extends Engine {
	protected renderRequestId: number = -1;

	public readonly gl: WebGLRenderingContext;
	public readonly debug: Debug;

	public readonly statsData = {
		updates: 0,
		fixedUpdates: 0,
		lastUpdateTime: 0,
		lastFixedUpdateTime: 0,
		frames: 0,
		frameCount: 0,
		drawCalls: 0,
		lastFPSUpdate: 0,
	};

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
			stats.addGraph({ id: 'fixedupdate', label: ' fupdates', min: 0, max: 50 });
			stats.addGraph({ id: 'draw', label: ' draws', min: 0, max: 20 });
		}
	}

	loadScene(scene: Scene) {
		if (!scene.getComponent(RendererComponent)) {
			scene.addComponent(new RendererComponent());
		}
		super.loadScene(scene);
	}

	start() {
		this.renderRequestId = requestAnimationFrame(this.bindedUpdateMethod as any);
		this.fixedUpdateRequestId = setInterval(this.bindedFixedUpdateMethod, this.fixedUpdateRate) as any;
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

	update() {
		this.renderRequestId = requestAnimationFrame(this.bindedUpdateMethod as any);

		this.statsData.frameCount++;
		this.statsData.frames++;
		this.statsData.drawCalls = this.statsData.updates = 0;

		const startTime = (performance || Date).now();

		super.update({
			canvas: this.canvas,
			gl: this.gl,
			debug: this.debug,
		});

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
