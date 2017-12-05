import { Scene } from './Scene';
import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

export class Actor implements IDisposable {
	readonly id: string;
	readonly scene: Scene;
	readonly parent: Actor;
	protected janitor: CompositeDisposable;

	constructor(id: string) {
		this.id = id;
		this.janitor = new CompositeDisposable();
	}

	dispose(): void {
		return this.janitor.dispose();
	}

	isDisposed(): boolean {
		return this.janitor.isDisposed();
	}

	onUpdate(): void {
		
	}

	onFixedUpdate(): void {
		
	}

	onRender(): void {

	}


}