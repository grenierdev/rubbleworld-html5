import { IDisposable } from '@konstellio/disposable';
import { Engine } from '../Engine';

export class Texture implements IDisposable {

	readonly texture: WebGLTexture;

	constructor(public engine: Engine, data: HTMLImageElement | ImageData | ImageBitmap) {
		const gl = engine.gl;

		this.texture = gl.createTexture()!;

		gl.bindTexture(gl.TEXTURE, this.texture);
		gl.texParameteri(gl.TEXTURE, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
	}

	dispose(): void {
	}

	isDisposed(): boolean {
		return true;
	}

	bind(): void {
		const gl = this.engine.gl;
		gl.bindTexture(gl.TEXTURE, this.texture);
	}
}