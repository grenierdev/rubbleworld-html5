import { IDisposable } from '@konstellio/disposable';
import { Texture } from './Texture';
import { Mutable } from '../util/Immutable';

export enum RenderTargetAttachment {
	COLOR0 = WebGLRenderingContext.COLOR_ATTACHMENT0,
	DEPTH = WebGLRenderingContext.DEPTH_ATTACHMENT,
}

export class RenderTarget implements IDisposable {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly frameBuffer?: WebGLFramebuffer;
	public readonly depthBuffer?: WebGLRenderbuffer;

	constructor(
		public readonly width: number,
		public readonly height: number,
		public readonly attachments: Map<RenderTargetAttachment, Texture> = new Map()
	) {}

	protected createRenderTarget(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`RenderTarget already compiled with an other WebGLRenderingContext.`);
		}

		if (this.frameBuffer) {
			return;
		}

		this.gl = gl;

		(this as any).frameBuffer = gl.createFramebuffer()!;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer!);

		for (const [attachment, texture] of this.attachments) {
			texture.createTexture(gl);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture.texture!, 0);
		}

		if (!this.attachments.get(RenderTargetAttachment.DEPTH)) {
			(this as any).depthBuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer!);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer!);
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
