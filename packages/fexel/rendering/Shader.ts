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

		gl.shaderSource(this.shader!, this.source);
		gl.compileShader(this.shader!);

		if (!gl.getShaderParameter(this.shader!, gl.COMPILE_STATUS)) {
			throw new SyntaxError(`Could not compile shader : ${gl.getShaderInfoLog(this.shader!)}.`);
		}
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

export class PartialShader {
	public readonly hasMainFunction: boolean;
	constructor(public type: ShaderType, public declarations: string, public body: string = '') {
		this.hasMainFunction = !!body.match(/void\s+main\s*\(/);
	}
}

export function mergeShaderPartials(...partials: PartialShader[]) {
	if (partials.length === 0) {
		throw new RangeError(`Expected a minimum of one PartialShader`);
	}
	const mains = partials.filter(p => p.hasMainFunction);
	if (mains.length !== 1) {
		throw new SyntaxError(`Expected one PartialShader that contain a main function, got ${mains.length}.`);
	}

	const mainType = mains[0].type;
	if (partials.filter(p => p.type !== mainType).length !== 0) {
		throw new SyntaxError(`Expected all PartialShader to be of the same ShaderType or undefined.`);
	}

	partials.sort((a, b) => (a.hasMainFunction ? 1 : 0) - (b.hasMainFunction ? 1 : 0));

	let declarations = '';
	let body = '';

	for (const partial of partials) {
		declarations += partial.declarations + `\n\n`;
		body += partial.body + `\n\n`;
	}

	if (mainType === ShaderType.Vertex) {
		return new VertexShader(declarations + `\n\n` + body);
	}
	return new FragmentShader(declarations + `\n\n` + body);
}
