import { IDisposable } from '@konstellio/disposable';
import { Shader } from './Shader';
import { isArray as isarray } from 'util';
import { Mesh } from './Mesh';
import { Texture } from './Texture';

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

export class Material implements IDisposable {
	private disposed: boolean;

	public readonly vertexShader: Shader;
	public readonly fragmentShader: Shader;
	public readonly program: WebGLProgram;

	public readonly attributes: Map<string, Attribute>;
	public readonly uniforms: Map<string, Uniform>;

	public static currentMaterial: Material | undefined;

	public twoSided: boolean;

	constructor(
		public gl: WebGLRenderingContext,
		vertex: string | Shader,
		fragment: string | Shader
	) {
		this.disposed = false;
		this.twoSided = false;

		this.vertexShader =
			typeof vertex === 'string'
				? new Shader(gl, vertex, gl.VERTEX_SHADER)
				: vertex;
		this.fragmentShader =
			typeof fragment === 'string'
				? new Shader(gl, fragment, gl.FRAGMENT_SHADER)
				: fragment;

		this.attributes = new Map();
		this.uniforms = new Map();

		this.program = gl.createProgram()!;
		gl.attachShader(this.program, this.vertexShader.shader);
		gl.attachShader(this.program, this.fragmentShader.shader);
		gl.linkProgram(this.program);

		const status = gl.getProgramParameter(this.program, gl.LINK_STATUS);
		if (!status) {
			throw new SyntaxError(
				`Could not load program : ${gl.getProgramInfoLog(this.program)}.`
			);
		}

		gl.detachShader(this.program, this.vertexShader.shader);
		gl.detachShader(this.program, this.fragmentShader.shader);

		let textureUnits = 0;
		let matches: RegExpExecArray | null;
		while (
			(matches = attrRegex.exec(
				this.vertexShader.source + this.fragmentShader.source
			))
		) {
			const [, type, name] = matches;
			this.attributes.set(name, {
				location: gl.getAttribLocation(this.program, name),
				type: type.toLocaleLowerCase() as Type,
			});
		}
		const structMap = new Map<string, Map<string, string>>();
		while (
			(matches = structRegex.exec(
				this.vertexShader.source + this.fragmentShader.source
			))
		) {
			const [, nameStruct, def] = matches;
			const vars = new Map<string, string>();
			while ((matches = varRegex.exec(def))) {
				const [, type, varName] = matches;
				vars.set(varName, type);
			}
			structMap.set(nameStruct, vars);
		}

		// TODO: getUniformLocation for arrays
		while (
			(matches = uniformRegex.exec(
				this.vertexShader.source + this.fragmentShader.source
			))
		) {
			const [, type, name] = matches;
			if (structMap.has(type)) {
				const vars = structMap.get(type)!;
				for (const [varName, varType] of vars) {
					const loc = gl.getUniformLocation(this.program, name + '.' + varName);
					if (loc) {
						this.uniforms.set(name + '.' + varName, {
							location: loc,
							type: varType.toLocaleLowerCase() as Type,
							value: undefined,
							...(isSampler(type.toLocaleLowerCase())
								? { slot: textureUnits++ }
								: {}),
						} as Uniform);
					}
				}
			} else {
				const loc = gl.getUniformLocation(this.program, name);
				if (loc) {
					this.uniforms.set(name, {
						location: loc,
						type: type.toLocaleLowerCase() as Type,
						value: undefined,
						...(isSampler(type.toLocaleLowerCase())
							? { slot: textureUnits++ }
							: {}),
					} as Uniform);
				}
			}
		}

		gl.useProgram(null);

		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
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
			Mesh.currentMesh = undefined;
			this.gl.useProgram(this.program);
			this.updateUniforms();
			if (this.twoSided) {
				this.gl.disable(this.gl.CULL_FACE);
			} else {
				this.gl.enable(this.gl.CULL_FACE);
			}
		}
	}

	setUniform(name: string, value: number | number[] | Texture): void {
		if (this.uniforms.has(name)) {
			const uniform = this.uniforms.get(name)!;
			uniform.value = value;
			if (Material.currentMaterial === this) {
				this.updateUniform(uniform);
			}
		}
	}

	updateUniforms(): void {
		for (const [name, uniform] of this.uniforms) {
			this.updateUniform(uniform);
		}
	}

	protected updateUniform(uniform: Uniform) {
		switch (uniform.type) {
			case Type.Sampler:
			case Type.Sampler2D:
			case Type.SamplerCube:
				if (
					uniform.value instanceof Texture &&
					typeof uniform.slot === 'number'
				) {
					this.gl.uniform1i(uniform.location, uniform.slot!);
					uniform.value.bind(uniform.slot!);
				} else {
					throw new SyntaxError(`Expected uniform ${name} to be a Texture.`);
				}
				break;
			case Type.Int:
				if (isArray(uniform.value)) {
					this.gl.uniform1iv(uniform.location, uniform.value);
				} else if (uniform.value) {
					this.gl.uniform1i(uniform.location, uniform.value);
				}
				break;
			case Type.Float:
				if (isArray(uniform.value)) {
					this.gl.uniform1fv(uniform.location, uniform.value);
				} else if (uniform.value) {
					this.gl.uniform1f(uniform.location, uniform.value);
				}
				break;
			case Type.IVec2:
				if (isArray(uniform.value)) {
					this.gl.uniform2iv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.IVec3:
				if (isArray(uniform.value)) {
					this.gl.uniform3iv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.IVec4:
				if (isArray(uniform.value)) {
					this.gl.uniform4iv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Vec2:
				if (isArray(uniform.value)) {
					this.gl.uniform2fv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Vec3:
				if (isArray(uniform.value)) {
					this.gl.uniform3fv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Vec4:
				if (isArray(uniform.value)) {
					this.gl.uniform4fv(uniform.location, uniform.value);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Mat2:
				if (isArray(uniform.value)) {
					this.gl.uniformMatrix2fv(
						uniform.location,
						uniform.transpose === true,
						uniform.value
					);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Mat3:
				if (isArray(uniform.value)) {
					this.gl.uniformMatrix3fv(
						uniform.location,
						uniform.transpose === true,
						uniform.value
					);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
			case Type.Mat4:
				if (isArray(uniform.value)) {
					this.gl.uniformMatrix4fv(
						uniform.location,
						uniform.transpose === true,
						uniform.value
					);
				} else {
					throw new SyntaxError(
						`Expected uniform ${name} to be an array of number.`
					);
				}
				break;
		}
	}
}
