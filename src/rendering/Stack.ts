import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

import { Texture } from './Texture';
import { Material } from './Material';

export class Stack implements IDisposable {

	constructor(public gl: WebGLRenderingContext) {
		gl.clearColor(0, 0, 0, 0);
	}

	dispose(): void {
		// return this.janitor.dispose();
	}

	isDisposed(): boolean {
		return true;
	}


	render(): void {
		const gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.flush();
	}

	createMaterial(vertexShader: string, fragmentShader: string): Promise<Material> {
		const gl = this.gl;
		
		return Promise.resolve(new Material(gl, vertexShader, fragmentShader));
	}
}