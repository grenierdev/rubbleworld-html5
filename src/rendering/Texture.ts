import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';

export class Texture implements IDisposable {

	protected loaded: boolean;
	protected error: boolean;

	readonly texture: WebGLTexture;

	constructor(public gl: WebGLRenderingContext, url: string) {
		this.loaded = false;
		this.error = false;

		this.texture = gl.createTexture()!;

		const image = new Image();
		image.src = url;
		image.onload = () => {

			gl.bindTexture(gl.TEXTURE, this.texture);
			gl.texParameteri(gl.TEXTURE, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
			gl.texParameteri(gl.TEXTURE, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
			gl.texParameteri(gl.TEXTURE, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			this.loaded = true;
		}
		image.onerror = (err) => {
			this.error = true;
		};
	}

	dispose(): void {
	}

	isDisposed(): boolean {
		return true;
	}

	bind(): void {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE, this.texture);
	}
}