import { IDisposable } from '@konstellio/disposable';
import { Mutable } from '../util/Immutable';

const LOADING_IMAGE = new ImageData(new Uint8ClampedArray([255, 0, 255, 255]), 1, 1);
const ZERO_IMAGE = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1);
const ONE_IMAGE = new ImageData(new Uint8ClampedArray([1, 1, 1, 1]), 1, 1);

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
	DEPTH_COMPONENT = WebGLRenderingContext.DEPTH_COMPONENT,
	DEPTH_COMPONENT16 = WebGLRenderingContext.DEPTH_COMPONENT16,
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
	public readonly data?: HTMLImageElement | ImageData | ImageBitmap;
	public readonly width?: number;
	public readonly height?: number;
	public readonly wrap = TextureWrap.CLAMP_TO_EDGE;
	public readonly filter = TextureFilter.NEAREST_MIPMAP_LINEAR;
	public readonly internalFormat = TextureFormat.RGBA;
	public readonly format = TextureFormat.RGBA;
	public readonly type = WebGLRenderingContext.UNSIGNED_BYTE;
	public readonly mipmap: boolean = true;

	constructor({
		width,
		height,
		wrap,
		filter,
		internalFormat,
		format,
		type,
		mipmap,
	}: {
		width: number;
		height: number;
		wrap?: TextureWrap;
		filter?: TextureFilter;
		internalFormat?: TextureFormat;
		format?: TextureFormat;
		type?: TextureType;
		mipmap?: boolean;
	});
	constructor({
		data,
		wrap,
		filter,
		internalFormat,
		format,
		type,
		mipmap,
	}: {
		data: HTMLImageElement | ImageData | ImageBitmap;
		wrap?: TextureWrap;
		filter?: TextureFilter;
		internalFormat?: TextureFormat;
		format?: TextureFormat;
		type?: TextureType;
		mipmap?: boolean;
	});
	constructor({
		data,
		width,
		height,
		wrap,
		filter,
		internalFormat,
		format,
		type,
		mipmap,
	}: {
		data?: HTMLImageElement | ImageData | ImageBitmap;
		width?: number;
		height?: number;
		wrap?: TextureWrap;
		filter?: TextureFilter;
		internalFormat?: TextureFormat;
		format?: TextureFormat;
		type?: TextureType;
		mipmap?: boolean;
	}) {
		this.data = data;
		this.width = width;
		this.height = height;
		this.wrap = wrap || TextureWrap.CLAMP_TO_EDGE;
		this.filter = filter || TextureFilter.LINEAR;
		this.internalFormat = internalFormat || TextureFormat.RGBA;
		this.format = format || TextureFormat.RGBA;
		this.type = type || TextureType.UNSIGNED_BYTE;
		this.mipmap = typeof mipmap === 'undefined' ? false : mipmap;
	}

	public createTexture(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`Texture already compiled with an other WebGLRenderingContext.`);
		}

		if (this.texture) {
			return;
		}

		if (
			this.internalFormat === WebGLRenderingContext.DEPTH_COMPONENT ||
			this.internalFormat === WebGLRenderingContext.DEPTH_COMPONENT16 ||
			this.format === WebGLRenderingContext.DEPTH_COMPONENT ||
			this.format === WebGLRenderingContext.DEPTH_COMPONENT16
		) {
			gl.getExtension('WEBGL_depth_texture');
		}

		(this as Mutable<Texture>).texture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, this.texture!);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.filter);

		if (this.data instanceof HTMLImageElement && this.data.complete === false) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, LOADING_IMAGE);
			this.data.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, this.texture!);
				gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, this.data!);
			};
		} else if (this.data) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.format, this.type, this.data);
		} else if (this.width && this.height) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, this.width, this.height, 0, this.format, this.type, null);
		}

		if (this.mipmap) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl && this.texture) {
				this.gl.deleteTexture(this.texture);
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext, slot = 0) {
		this.createTexture(gl);

		gl.bindTexture(gl.TEXTURE_2D, this.texture!);
		gl.activeTexture(gl[`TEXTURE${slot}`]);
	}

	static Empty = new Texture({ data: ZERO_IMAGE });
	static EmptyDepth = new Texture({ data: ZERO_IMAGE });
}
