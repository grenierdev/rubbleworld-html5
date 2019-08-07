import { IDisposable } from '@konstellio/disposable';
import { VertexShader, FragmentShader } from './Shader';
import { isArray as isarray } from 'util';
import { Mesh } from './Mesh';
import { Texture } from './Texture';
import { Mutable } from '../util/Immutable';

function isArray<T>(value: any): value is T[] {
	return isarray(value);
}

export enum Type {
	Int = 'int',
	Float = 'float',
	IVec2 = 'ivec2',
	IVec3 = 'ivec3',
	IVec4 = 'ivec4',
	Vec2 = 'vec2',
	Vec3 = 'vec3',
	Vec4 = 'vec4',
	Mat2 = 'mat2',
	Mat3 = 'mat3',
	Mat4 = 'mat4',
	Sampler = 'sampler',
	Sampler2D = 'sampler2d',
	SamplerCube = 'samplercube',
	Unknown = 'unknown',
}

export interface Attribute {
	location: number;
	type: Type;
}

export interface UniformBase<T, V> {
	location: WebGLUniformLocation;
	type: T;
	value: undefined | V;
}

export interface UniformMatrixBase<T, V> {
	location: WebGLUniformLocation;
	type: T;
	value: undefined | V;
	transpose?: boolean;
}

export interface UniformSamplerBase<T, V> {
	location: WebGLUniformLocation;
	type: T;
	value: undefined | V;
	slot?: number;
}

export type UniformUnknown = UniformBase<Type.Unknown, any>;
export type UniformInt = UniformBase<Type.Int, number | number[]>;
export type UniformFloat = UniformBase<Type.Float, number | number[]>;
export type UniformIVec2 = UniformBase<Type.IVec2, number[]>;
export type UniformIVec3 = UniformBase<Type.IVec3, number[]>;
export type UniformIVec4 = UniformBase<Type.IVec4, number[]>;
export type UniformVec2 = UniformBase<Type.Vec2, number[]>;
export type UniformVec3 = UniformBase<Type.Vec3, number[]>;
export type UniformVec4 = UniformBase<Type.Vec4, number[]>;
export type UniformMat2 = UniformMatrixBase<Type.Mat2, number[]>;
export type UniformMat3 = UniformMatrixBase<Type.Mat3, number[]>;
export type UniformMat4 = UniformMatrixBase<Type.Mat4, number[]>;
export type UniformSampler = UniformSamplerBase<Type.Sampler, Texture>;
export type UniformSampler2D = UniformSamplerBase<Type.Sampler2D, Texture>;
export type UniformSamplerCube = UniformSamplerBase<Type.SamplerCube, Texture>;

export type Uniform =
	| UniformUnknown
	| UniformInt
	| UniformFloat
	| UniformIVec2
	| UniformIVec3
	| UniformIVec4
	| UniformVec2
	| UniformVec3
	| UniformVec4
	| UniformMat2
	| UniformMat3
	| UniformMat4
	| UniformSampler
	| UniformSampler2D
	| UniformSamplerCube;

const attrRegex = /attribute\s+([^\s]+)\s+([^\s;]+);/gi;
const uniformRegex = /uniform\s+([^\s]+)\s+([^\s;]+);/gi;
const structRegex = /struct\s+([^\s]+)\s+\{([^}]*)\};/gi;
const varRegex = /\s*([^\s]+)\s+([^\s;]+);/gi;

function isSampler(type: string): boolean {
	return type === 'sampler' || type === 'sampler2d' || type === 'samplercube';
}

export enum MaterialQueue {
	Background = 1000,
	Geometry = 2000,
	AlphaTest = 2450,
	Transparent = 3000,
	Overlay = 4000,
}

export class Material implements IDisposable {
	public static currentMaterial?: Material;

	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly attributes: Map<string, Attribute> = new Map();
	public readonly program?: WebGLProgram;
	public queue: MaterialQueue | number = 0;
	public transparent: boolean = false;
	public twoSided: boolean = false;
	public readonly uniforms: Map<string, Uniform> = new Map();

	constructor(public readonly vertexShader: VertexShader, public readonly fragmentShader: FragmentShader) {}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl && this.program) {
				this.gl.deleteProgram(this.program);
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext) {
		this.createProgram(gl);

		if (Material.currentMaterial !== this) {
			Material.currentMaterial = this;
			Mesh.currentMesh = undefined;
			gl.useProgram(this.program!);
			if (this.twoSided) {
				gl.disable(gl.CULL_FACE);
			} else {
				gl.enable(gl.CULL_FACE);
			}
			if (this.transparent) {
				gl.disable(gl.DEPTH_TEST);
				gl.enable(gl.BLEND);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			} else {
				gl.enable(gl.DEPTH_TEST);
				gl.disable(gl.BLEND);
			}
		}
		this.updateUniforms();
	}

	protected createProgram(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`Material already compiled with an other WebGLRenderingContext.`);
		}

		if (this.program) {
			return;
		}

		this.gl = gl;

		this.vertexShader.compile(gl);
		this.fragmentShader.compile(gl);

		(this as Mutable<Material>).program = gl.createProgram()!;
		gl.attachShader(this.program!, this.vertexShader.shader!);
		gl.attachShader(this.program!, this.fragmentShader.shader!);
		gl.linkProgram(this.program!);

		const status = gl.getProgramParameter(this.program!, gl.LINK_STATUS);
		if (!status) {
			throw new SyntaxError(`Could not load program : ${gl.getProgramInfoLog(this.program!)}.`);
		}

		gl.detachShader(this.program!, this.vertexShader.shader!);
		gl.detachShader(this.program!, this.fragmentShader.shader!);

		let textureUnits = 0;
		let matches: RegExpExecArray | null;
		while ((matches = attrRegex.exec(this.vertexShader.source + this.fragmentShader.source))) {
			const [, type, name] = matches;
			this.attributes.set(name, {
				location: gl.getAttribLocation(this.program!, name),
				type: type.toLocaleLowerCase() as Type,
			});
		}
		const structMap = new Map<string, Map<string, string>>();
		while ((matches = structRegex.exec(this.vertexShader.source + this.fragmentShader.source))) {
			const [, nameStruct, def] = matches;
			const vars = new Map<string, string>();
			while ((matches = varRegex.exec(def))) {
				const [, type, varName] = matches;
				vars.set(varName, type);
			}
			structMap.set(nameStruct, vars);
		}

		// TODO: getUniformLocation for arrays
		while ((matches = uniformRegex.exec(this.vertexShader.source + this.fragmentShader.source))) {
			const [, type, name] = matches;
			if (structMap.has(type)) {
				const vars = structMap.get(type)!;
				for (const [varName, varType] of vars) {
					const loc = gl.getUniformLocation(this.program!, name + '.' + varName);
					if (loc) {
						const existingUniform = this.uniforms.get(name + '.' + varName);
						this.uniforms.set(name + '.' + varName, {
							location: loc,
							type: varType.toLocaleLowerCase() as Type,
							value: existingUniform ? existingUniform.value : undefined,
							...(isSampler(type.toLocaleLowerCase()) ? { slot: textureUnits++ } : {}),
						} as Uniform);
					}
				}
			} else {
				const loc = gl.getUniformLocation(this.program!, name);
				if (loc) {
					const existingUniform = this.uniforms.get(name);
					this.uniforms.set(name, {
						location: loc,
						type: type.toLocaleLowerCase() as Type,
						value: existingUniform ? existingUniform.value : undefined,
						...(isSampler(type.toLocaleLowerCase()) ? { slot: textureUnits++ } : {}),
					} as Uniform);
				}
			}
		}

		gl.useProgram(null);

		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
	}

	setUniform(name: string, value: number | number[] | Texture) {
		if (!this.uniforms.has(name)) {
			this.uniforms.set(name, {
				location: -1,
				type: Type.Unknown,
				value: undefined,
			});
		}

		const uniform = this.uniforms.get(name)!;
		uniform.value = value;
	}

	updateUniforms() {
		if (this.gl) {
			for (const [name, uniform] of this.uniforms) {
				this.updateUniform(uniform);
			}
		}
	}

	protected updateUniform(uniform: Uniform) {
		if (this.gl) {
			const gl = this.gl;
			switch (uniform.type) {
				case Type.Sampler:
				case Type.Sampler2D:
				case Type.SamplerCube:
					if (uniform.value instanceof Texture && typeof uniform.slot === 'number') {
						gl.uniform1i(uniform.location, uniform.slot!);
						uniform.value.bind(gl, uniform.slot!);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be a Texture.`);
					}
					break;
				case Type.Int:
					if (isArray(uniform.value)) {
						gl.uniform1iv(uniform.location, uniform.value);
					} else if (uniform.value) {
						gl.uniform1i(uniform.location, uniform.value);
					}
					break;
				case Type.Float:
					if (isArray(uniform.value)) {
						gl.uniform1fv(uniform.location, uniform.value);
					} else if (uniform.value) {
						gl.uniform1f(uniform.location, uniform.value);
					}
					break;
				case Type.IVec2:
					if (isArray(uniform.value)) {
						gl.uniform2iv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.IVec3:
					if (isArray(uniform.value)) {
						gl.uniform3iv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.IVec4:
					if (isArray(uniform.value)) {
						gl.uniform4iv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Vec2:
					if (isArray(uniform.value)) {
						gl.uniform2fv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Vec3:
					if (isArray(uniform.value)) {
						gl.uniform3fv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Vec4:
					if (isArray(uniform.value)) {
						gl.uniform4fv(uniform.location, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat2:
					if (isArray(uniform.value)) {
						gl.uniformMatrix2fv(uniform.location, uniform.transpose === true, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat3:
					if (isArray(uniform.value)) {
						gl.uniformMatrix3fv(uniform.location, uniform.transpose === true, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat4:
					if (isArray(uniform.value)) {
						gl.uniformMatrix4fv(uniform.location, uniform.transpose === true, uniform.value);
					} else {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
			}
		}
	}
}
