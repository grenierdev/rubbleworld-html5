import { IDisposable } from '@konstellio/disposable';
import { Shader } from './Shader';
import { isArray as isarray } from 'util';

function isArray<T>(value: any): value is T[] {
	return isarray(value);
}

export class Material implements IDisposable {

	private disposed: boolean;

	public readonly vertexShader: Shader;
	public readonly fragmentShader: Shader;
	public readonly program: WebGLProgram;

	public readonly attributeTypes: Map<string, string>;
	public readonly attributeLocations: Map<string, number>;
	
	public readonly uniformTypes: Map<string, string>;
	public readonly uniformLocations: Map<string, WebGLUniformLocation>;
	public readonly uniforms: Map<string, undefined | number | number[]>;

	public static currentMaterial: Material | undefined;

	constructor(
		public gl: WebGLRenderingContext,
		vertex: string | Shader,
		fragment: string | Shader
	) {
		this.disposed = false;

		this.vertexShader = typeof vertex === 'string' ? new Shader(gl, vertex, gl.VERTEX_SHADER) : vertex;
		this.fragmentShader = typeof fragment === 'string' ? new Shader(gl, fragment, gl.FRAGMENT_SHADER) : fragment;

		this.attributeTypes = new Map();
		this.attributeLocations = new Map();
		this.uniformTypes = new Map();
		this.uniformLocations = new Map();
		this.uniforms = new Map();

		this.program = gl.createProgram()!;
		gl.attachShader(this.program, this.vertexShader.shader);
		gl.attachShader(this.program, this.fragmentShader.shader);
		gl.linkProgram(this.program);

		const status = gl.getProgramParameter(this.program, gl.LINK_STATUS);
		if (!status) {
			throw new SyntaxError(`Could not load program : ${gl.getProgramInfoLog(this.program)}.`);
		}

		gl.detachShader(this.program, this.vertexShader.shader);
		gl.detachShader(this.program, this.fragmentShader.shader);

		const attrRegex = /attribute ([^ ]+) ([^ ;]+);/gi;
		const uniformRegex = /uniform ([^ ]+) ([^ ;]+);/gi;

		let matches: RegExpExecArray | null;
		while (matches = attrRegex.exec(this.vertexShader.source + this.fragmentShader.source)) {
			const [, type, name] = matches;
			this.attributeTypes.set(name, type.toLocaleLowerCase());
			this.attributeLocations.set(name, gl.getAttribLocation(this.program, name));
		}
		while (matches = uniformRegex.exec(this.vertexShader.source + this.fragmentShader.source)) {
			const [, type, name] = matches;
			this.uniformTypes.set(name, type.toLocaleLowerCase());
			this.uniformLocations.set(name, gl.getUniformLocation(this.program, name)!);
			this.uniforms.set(name, undefined);
		}

		gl.useProgram(null);
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteProgram(this.program);
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	bind(): void {
		if (Material.currentMaterial !== this) {
			Material.currentMaterial = this;
			this.gl.useProgram(this.program);
			this.updateUniforms();
		}

	}

	setUniform(name: string, value: number | number[]): void {
		if (this.uniforms.has(name)) {
			this.uniforms.set(name, value);
			if (Material.currentMaterial === this) {
				const indx = this.uniformLocations.get(name)!;
				const type = this.uniformTypes.get(name)!;
				this.updateUniform(indx, type, value);
			}
		}
	}

	updateUniforms(): void {
		for (const [name, value] of this.uniforms) {
			if (value) {
				const indx = this.uniformLocations.get(name)!;
				const type = this.uniformTypes.get(name)!;
				this.updateUniform(indx, type, value);
			}
		}
	}

	protected updateUniform(indx: WebGLUniformLocation, type: string, value: number | number[]) {
		if ((type === 'ivec2' || type === 'ivec3' || type === 'ivec4' || type === 'vec2' || type === 'vec3' || type === 'vec4' || type === 'mat2' || type === 'mat3' || type === 'mat4') && isArray(value) === false) {
			throw new SyntaxError(`Expected uniform ${name} to be an array of number. Got ${value}.`);
		}
		else if ((type === 'sampler' || type === 'sampler2d' || type === 'samplercube') && isArray(value)) {
			throw new SyntaxError(`Expected uniform ${name} to be a number.`);
		}

		switch (type) {
			case 'int':
				if (isArray(value)) {
					this.gl.uniform1iv(indx, value);
				} else {
					this.gl.uniform1i(indx, value);
				}
				break;
			case 'float':
				if (isArray(value)) {
					this.gl.uniform1fv(indx, value);
				} else {
					this.gl.uniform1f(indx, value);
				}
				break;
			case 'sampler':
			case 'sampler2d':
			case 'samplercube':
				this.gl.uniform1i(indx, value as number);
				break;
			case 'ivec2': this.gl.uniform2iv(indx, value as number[]); break;
			case 'ivec3': this.gl.uniform3iv(indx, value as number[]); break;
			case 'ivec4': this.gl.uniform4iv(indx, value as number[]); break;
			case 'vec2': this.gl.uniform2fv(indx, value as number[]); break;
			case 'vec3': this.gl.uniform3fv(indx, value as number[]); break;
			case 'vec4': this.gl.uniform4fv(indx, value as number[]); break;
			case 'mat2': this.gl.uniformMatrix2fv(indx, false, value as number[]); break;
			case 'mat3': this.gl.uniformMatrix3fv(indx, false, value as number[]); break;
			case 'mat4': this.gl.uniformMatrix4fv(indx, false, value as number[]); break;
		}
	}
}