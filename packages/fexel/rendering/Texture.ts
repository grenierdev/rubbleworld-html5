import { IDisposable } from '@konstellio/disposable';
import { Mutable } from '../util/Mutable';

const LoadingImage = new ImageData(
	new Uint8ClampedArray([255, 0, 255, 255]),
	1,
	1
);

export enum TextureWrap {
	REPEAT = WebGLRenderingContext.REPEAT,
	CLAMP_TO_EDGE = WebGLRenderingContext.CLAMP_TO_EDGE,
	MIRRORED_REPEAT = WebGLRenderingContext.MIRRORED_REPEAT,
}

export enum TextureFilter {
	LINEAR = WebGLRenderingContext.LINEAR,
	LINEAR_MIPMAP_LINEAR = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR,
	LINEAR_MIPMAP_NEAREST = WebGLRenderingContext.LINEAR_MIPMAP_NEAREST,
	NEAREST = WebGLRenderingContext.NEAREST,
	NEAREST_MIPMAP_LINEAR = WebGLRenderingContext.NEAREST_MIPMAP_LINEAR,
	NEAREST_MIPMAP_NEAREST = WebGLRenderingContext.NEAREST_MIPMAP_NEAREST,
}

export enum TextureFormat {
	RGBA = WebGLRenderingContext.RGBA,
	RGB = WebGLRenderingContext.RGB,
	LUMINANCE_ALPHA = WebGLRenderingContext.LUMINANCE_ALPHA,
	LUMINANCE = WebGLRenderingContext.LUMINANCE,
	ALPHA = WebGLRenderingContext.ALPHA,
}

export enum TextureType {
	UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE,
	UNSIGNED_SHORT_5_6_5 = WebGLRenderingContext.UNSIGNED_SHORT_5_6_5,
	UNSIGNED_SHORT_4_4_4_4 = WebGLRenderingContext.UNSIGNED_SHORT_4_4_4_4,
	UNSIGNED_SHORT_5_5_5_1 = WebGLRenderingContext.UNSIGNED_SHORT_5_5_5_1,
	UNSIGNED_SHORT = WebGLRenderingContext.UNSIGNED_SHORT,
	UNSIGNED_INT = WebGLRenderingContext.UNSIGNED_INT,
	// UNSIGNED_INT_24_8_WEBGL = WebGLRenderingContext.UNSIGNED_INT_24_8_WEBGL,
	FLOAT = WebGLRenderingContext.FLOAT,
	// HALF_FLOAT_OES = WebGLRenderingContext.HALF_FLOAT_OES,
	BYTE = WebGLRenderingContext.BYTE,
	SHORT = WebGLRenderingContext.SHORT,
	INT = WebGLRenderingContext.INT,
	// HALF_FLOAT = WebGLRenderingContext.HALF_FLOAT,
	// UNSIGNED_INT_2_10_10_10_REV = WebGLRenderingContext.UNSIGNED_INT_2_10_10_10_REV,
	// UNSIGNED_INT_10F_11F_11F_REV = WebGLRenderingContext.UNSIGNED_INT_10F_11F_11F_REV,
	// UNSIGNED_INT_5_9_9_9_REV = WebGLRenderingContext.UNSIGNED_INT_5_9_9_9_REV,
	// UNSIGNED_INT_24_8 = WebGLRenderingContext.UNSIGNED_INT_24_8,
	// FLOAT_32_UNSIGNED_INT_24_8_REV = WebGLRenderingContext.FLOAT_32_UNSIGNED_INT_24_8_REV,
}

export class Texture implements IDisposable {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly texture?: WebGLTexture;

	constructor(
		public readonly data: HTMLImageElement | ImageData | ImageBitmap,
		public readonly wrap = TextureWrap.MIRRORED_REPEAT,
		public readonly filter = TextureFilter.NEAREST_MIPMAP_LINEAR,
		public readonly format = TextureFormat.RGBA,
		public readonly type = WebGLRenderingContext.UNSIGNED_BYTE
	) {}

	protected createTexture(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(
				`Texture already compiled with an other WebGLRenderingContext.`
			);
		}

		if (this.texture) {
			return;
		}

		(this as Mutable<Texture>).texture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, this.texture!);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.filter);

		if (this.data instanceof HTMLImageElement && this.data.complete === false) {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				this.format,
				this.format,
				this.type,
				LoadingImage
			);
			this.data.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, this.texture!);
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					this.format,
					this.format,
					this.type,
					this.data
				);
			};
		} else {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				this.format,
				this.format,
				this.type,
				this.data
			);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	dispose(): void {
		if (this.disposed === false) {
			if (this.gl) {
				this.gl.deleteTexture(this.texture!);
			}
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext, slot = 0): void {
		this.createTexture(gl);

		gl.bindTexture(gl.TEXTURE_2D, this.texture!);
		gl.activeTexture(gl[`TEXTURE${slot}`]);
	}
}
