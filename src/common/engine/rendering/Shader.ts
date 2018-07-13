import { IDisposable } from '@konstellio/disposable';


export class Shader implements IDisposable {
	private disposed: boolean;

	public readonly shader: WebGLShader;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly source: string,
		public readonly type = gl.VERTEX_SHADER
	) {
		this.disposed = false;

		this.shader = gl.createShader(type)!;

		gl.shaderSource(this.shader, source);
		gl.compileShader(this.shader);

		if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
			throw new SyntaxError(`Could not compile shader : ${gl.getShaderInfoLog(this.shader)}.`);
		}
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteShader(this.shader);
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}
}