import { IDisposable } from '@konstellio/disposable';
import { Texture } from './Texture';
import { Mutable } from '../util/Immutable';

export class RenderTarget implements IDisposable {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly frameBuffer?: WebGLFramebuffer;
	public readonly depthBuffer?: WebGLRenderbuffer;

	constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly texture: Texture,
		public readonly depth: boolean = false,
		public readonly stencil: boolean = false
	) {}

	protected createRenderTarget(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`RenderTarget already compiled with an other WebGLRenderingContext.`);
		}

		if (this.frameBuffer) {
			return;
		}

		this.gl = gl;

		this.texture.createTexture(gl);

		(this as Mutable<RenderTarget>).frameBuffer = gl.createFramebuffer()!;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer!);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture!, 0);

		if (this.depth) {
			(this as Mutable<RenderTarget>).depthBuffer = gl.createRenderbuffer()!;
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer!);
			gl.renderbufferStorage(
				gl.RENDERBUFFER,
				this.stencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT16,
				this.width,
				this.height
			);
			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				this.stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER,
				this.depthBuffer!
			);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl && this.frameBuffer) {
				this.gl.deleteFramebuffer(this.frameBuffer);
				if (this.depthBuffer) {
					this.gl.deleteRenderbuffer(this.depthBuffer);
				}
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext) {
		this.createRenderTarget(gl);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer!);
	}
}
