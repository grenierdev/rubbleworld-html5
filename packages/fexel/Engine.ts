import { IDisposable } from '@konstellio/disposable';
import { Scene, UpdateContext } from './Scene';
import { Debug } from './rendering/Debug';
import { Stats } from './Stats';
import { RendererComponent } from './components/Renderer';

export class Engine implements IDisposable {
	protected mainScene?: Scene;
	protected updateRequestId: number = -1;
	protected fixedUpdateRequestId: number = -1;
	protected readonly bindedUpdateMethod: (context?: Partial<UpdateContext>) => void;
	protected readonly bindedFixedUpdateMethod: (context?: Partial<UpdateContext>) => void;
	public readonly debug?: Debug;

	public readonly statsData = {
		updates: 0,
		fixedUpdates: 0,
		time: 0,
		deltaTime: 0,
		fixedTime: 0,
		fixedDeltaTime: 0,
		lastUpdateTime: (performance || Date).now(),
		lastFixedUpdateTime: (performance || Date).now(),
	};

	constructor(public fixedUpdateRate = 1000 / 60, debug = false) {
		this.bindedUpdateMethod = this.update.bind(this);
		this.bindedFixedUpdateMethod = this.fixedUpdate.bind(this);

		if (debug) {
			this.debug = new Debug();
		}
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
		this.statsData.lastUpdateTime = this.statsData.lastFixedUpdateTime = -1;
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
			if (this.statsData.lastUpdateTime === -1) {
				this.statsData.lastUpdateTime = time;
			}
			const deltaTime = time - this.statsData.lastUpdateTime;
			this.statsData.lastUpdateTime = time;
			this.statsData.time = time;
			this.statsData.deltaTime = deltaTime;

			const ticker = this.mainScene.update({
				...context,
				time,
				deltaTime,
				fixedTime: this.statsData.fixedTime,
				fixedDeltaTime: this.statsData.fixedDeltaTime,
				timeScale: 1,
				frameCount: 0,
				debug: this.debug,
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
			const fixedTime = (performance || Date).now();
			if (this.statsData.lastFixedUpdateTime === -1) {
				this.statsData.lastFixedUpdateTime = fixedTime;
			}
			const fixedDeltaTime = fixedTime - this.statsData.lastFixedUpdateTime;
			this.statsData.lastFixedUpdateTime = fixedTime;
			this.statsData.fixedTime = fixedTime;
			this.statsData.fixedDeltaTime = fixedDeltaTime;

			const ticker = this.mainScene.fixedUpdate({
				time: this.statsData.time,
				deltaTime: this.statsData.deltaTime,
				fixedTime,
				fixedDeltaTime,
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

export class EngineStats extends Stats {
	constructor(public engine: Engine, public renderer: RendererComponent, width?: number, height?: number) {
		super(width, height);

		this.addGraph({ id: 'fps', label: 'fps', min: 60, max: 60, color: '#148DD9' });
		this.addGraph({ id: 'update', label: 'upd', min: 0, max: 50, color: '#19B39E' });
		this.addGraph({ id: 'ums', label: 'ms', min: 0, max: 1000 / 60, color: '#25D967' });
		this.addGraph({ id: 'fixedupdate', label: 'fupd', min: 0, max: 50, color: '#C7262B' });
		this.addGraph({ id: 'fms', label: 'ms', min: 0, max: 1000 / 30, color: '#EB5C2D' });
		this.addGraph({ id: 'draw', label: 'draw', min: 0, max: 20, color: '#C728B7' });
		if (HAS_MEMORY) {
			this.addGraph({
				id: 'mem',
				label: 'Mb',
				min: 0,
				max: (performance as any).memory.jsHeapSizeLimit / 1048576 / 10,
				color: '#E3D324',
			});
		}
	}

	update() {
		this.updateGraph('fps', this.renderer.statsData.framePerSecond);
		this.updateGraph('update', this.engine.statsData.updates);
		this.updateGraph('ums', this.engine.statsData.deltaTime);
		this.updateGraph('fixedupdate', this.engine.statsData.fixedUpdates);
		this.updateGraph('fms', this.engine.statsData.fixedDeltaTime);
		this.updateGraph('draw', this.renderer.statsData.drawCalls);
		if (HAS_MEMORY) {
			this.updateGraph('mem', +((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1));
		}
		super.update();
	}
}
