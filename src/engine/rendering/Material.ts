import { Disposable, CompositeDisposable, IDisposable } from 'konstellio-disposable';
import { Engine } from '../';

export class Material implements IDisposable {

	readonly program: WebGLProgram;

	readonly attributes: Map<string, any>;
	readonly uniforms: Map<string, any>;

	protected attributeTypes: Map<string, string>;
	protected uniformTypes: Map<string, string>;

	protected attributeLocations: Map<string, number>;
	protected uniformLocations: Map<string, WebGLUniformLocation>;

	constructor(public engine: Engine, vertex: string, fragment: string) {
		const gl = engine.gl;

		this.attributes = new Map<string, any>();
		this.uniforms = new Map<string, any>();
		this.attributeTypes = new Map<string, string>();
		this.uniformTypes = new Map<string, string>();
		this.attributeLocations = new Map<string, number>();
		this.uniformLocations = new Map<string, WebGLUniformLocation>();

		const vertexShader = Material.getShader(gl, gl.VERTEX_SHADER, vertex);
		const fragmentShader = Material.getShader(gl, gl.FRAGMENT_SHADER, fragment);

		this.program = gl.createProgram()!;
		gl.attachShader(this.program, vertexShader);
		gl.attachShader(this.program, fragmentShader);
		gl.linkProgram(this.program);

		const status = gl.getProgramParameter(this.program, gl.LINK_STATUS);

		if (!status) {
			throw new SyntaxError(`Could not load program : ${gl.getProgramInfoLog(this.program)}.`);
		}

		gl.detachShader(this.program, vertexShader);
		gl.detachShader(this.program, fragmentShader);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		const attrRegex = /attribute ([^ ]+) ([^ ;]+);/gi;
		const uniformRegex = /uniform ([^ ]+) ([^ ;]+);/gi;

		let matches: RegExpExecArray | null;
		while (matches = attrRegex.exec(vertex + fragment)) {
			const [, type, name] = matches;
			this.attributes.set(name, null);
			this.attributeTypes.set(name, type);
			this.attributeLocations.set(name, gl.getAttribLocation(this.program, name));
		}
		while (matches = uniformRegex.exec(vertex + fragment)) {
			const [, type, name] = matches;
			this.uniforms.set(name, null);
			this.uniformTypes.set(name, type);
			this.uniformLocations.set(name, gl.getUniformLocation(this.program, name)!);
		}

		gl.useProgram(null);
	}

	static getShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
		const shader = gl.createShader(type)!;

		gl.createShader(type)!;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new SyntaxError(`Could not compile shader : ${gl.getShaderInfoLog(shader)}.`);
		}

		return shader;
	}

	dispose(): void {
	}

	isDisposed(): boolean {
		return true;
	}

	bind(): void {
		const gl = this.engine.gl;

		gl.useProgram(this.program);
	}
}