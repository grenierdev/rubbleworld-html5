import { IDisposable } from '@konstellio/disposable';

import { Material } from './rendering/Material';
import { Texture } from './rendering/Texture';
import { Scene } from './Scene';

export class Engine implements IDisposable {
	readonly mainScene?: Scene;

	constructor(public gl: WebGLRenderingContext, scene?: Scene) {
		gl.clearColor(0, 0, 0, 0);
		this.mainScene = scene;
	}

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	render(): void {
		const gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		if (this.mainScene) {
			// Render scene...
		}

		gl.flush();
	}

	update(): void {
		if (this.mainScene) {
			// Update scene...
		}
	}

	// createMaterial(
	// 	vertexShader: string,
	// 	fragmentShader: string
	// ): Promise<Material> {
	// 	return Promise.resolve(new Material(this, vertexShader, fragmentShader));
	// }

	// loadTexture(url: string): Promise<Texture> {
	// 	return loadImageFromUrl(url).then(image => {
	// 		return new Texture(this, image);
	// 	});
	// }
}
