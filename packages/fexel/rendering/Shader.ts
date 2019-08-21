import { IDisposable } from '@konstellio/disposable';
import { Mutable } from '../util/Immutable';

export enum ShaderType {
	Vertex = WebGLRenderingContext.VERTEX_SHADER,
	Fragment = WebGLRenderingContext.FRAGMENT_SHADER,
}

export abstract class Shader implements IDisposable {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly shader?: WebGLShader;

	constructor(public readonly source: string, public readonly type: ShaderType) {}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl && this.shader) {
				this.gl.deleteShader(this.shader);
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	compile(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`Shader already compiled with an other WebGLRenderingContext.`);
		}

		if (this.shader) {
			return;
		}

		this.gl = gl;
		(this as Mutable<Shader>).shader = gl.createShader(this.type)!;

		let source = Shader.processInclude(this.source);

		if (!source.match(/^[ \t]*precision\s+(lowp|mediump|highp)\s+int;/gm)) {
			source = `precision mediump int;\n${source}`;
		}
		if (!source.match(/^[ \t]*precision\s+(lowp|mediump|highp)\s+float;/gm)) {
			source = `precision mediump float;\n${source}`;
		}

		gl.shaderSource(this.shader!, source);
		gl.compileShader(this.shader!);

		if (!gl.getShaderParameter(this.shader!, gl.COMPILE_STATUS)) {
			throw new SyntaxError(`Could not compile shader : ${gl.getShaderInfoLog(this.shader!)}.`);
		}
	}

	private static shaderLibrary: Map<string, string> = new Map();

	public static registerInclude(path: string, source: string) {
		if (Shader.shaderLibrary.has(path)) {
			throw new ReferenceError(`Shader import ${path} is already defined.`);
		}
		Shader.shaderLibrary.set(path, source);
	}

	private static processInclude(source: string): string {
		return source.replace(/^[ \t]*#include\s+([^;]+);/gm, (match, include) => {
			if (Shader.shaderLibrary.get(include)) {
				return Shader.processInclude(Shader.shaderLibrary.get(include)!);
			}
			throw new ReferenceError(`Could not locate ${include}.`);
		});
	}
}

export class VertexShader extends Shader {
	constructor(source: string) {
		super(source, WebGLRenderingContext.VERTEX_SHADER);
	}
}

export class FragmentShader extends Shader {
	constructor(source: string) {
		super(source, WebGLRenderingContext.FRAGMENT_SHADER);
	}
}
