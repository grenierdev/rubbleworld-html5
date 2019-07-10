import { IDisposable } from '@konstellio/disposable';

import { Material } from './rendering/Material';
import { Texture } from './rendering/Texture';
import { Scene } from './Scene';

export class Engine implements IDisposable {
	protected mainScene?: Scene;

	constructor(public gl: WebGLRenderingContext, scene?: Scene) {
		this.mainScene = scene;
	}

	dispose(): void {}

	isDisposed(): boolean {
		return true;
	}

	loadScene(scene: Scene) {
		// TODO Unload last scene ?
		this.mainScene = scene;
	}

	render(): void {
		const gl = this.gl;

		// From camera
		const viewport = gl.getParameter(gl.VIEWPORT);
		gl.viewport(0, 0, viewport[0], viewport[1]);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// From material
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.CULL_FACE);

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
