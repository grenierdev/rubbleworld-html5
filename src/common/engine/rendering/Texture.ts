import { IDisposable } from '@konstellio/disposable';

const LoadingImage = new ImageData(new Uint8ClampedArray([255, 0, 255, 255]), 1, 1);

export class Texture implements IDisposable {
	private disposed: boolean;

	readonly texture: WebGLTexture;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly data: HTMLImageElement | ImageData | ImageBitmap,
		public readonly wrap = gl.MIRRORED_REPEAT,
		public readonly filter = gl.NEAREST,
		public readonly format = gl.RGBA,
		public readonly type = gl.UNSIGNED_BYTE
	) {
		this.disposed = false;

		this.texture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);

		if (data instanceof HTMLImageElement && data.complete === false) {
			gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, LoadingImage);
			data.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, this.texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, data);
			}
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, data);
		}
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteTexture(this.texture);
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	bind(slot?: number): void {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.activeTexture(typeof slot === 'undefined' ? this.gl.TEXTURE0 : slot);
	}
}