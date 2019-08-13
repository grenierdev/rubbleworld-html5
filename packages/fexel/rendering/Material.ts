import { IDisposable } from '@konstellio/disposable';
import { VertexShader, FragmentShader } from './Shader';
import { isArray as isarray, isNull } from 'util';
import { Mesh } from './Mesh';
import { Texture } from './Texture';
import { Mutable } from '../util/Immutable';
import setPath from 'lodash.set';

function isArray<T>(value: any): value is T[] {
	return isarray(value);
}

export enum Type {
	Int = WebGLRenderingContext.INT,
	Float = WebGLRenderingContext.FLOAT,
	IVec2 = WebGLRenderingContext.INT_VEC2,
	IVec3 = WebGLRenderingContext.INT_VEC3,
	IVec4 = WebGLRenderingContext.INT_VEC4,
	Vec2 = WebGLRenderingContext.FLOAT_VEC2,
	Vec3 = WebGLRenderingContext.FLOAT_VEC3,
	Vec4 = WebGLRenderingContext.FLOAT_VEC4,
	Mat2 = WebGLRenderingContext.FLOAT_MAT2,
	Mat3 = WebGLRenderingContext.FLOAT_MAT3,
	Mat4 = WebGLRenderingContext.FLOAT_MAT4,
	Sampler = WebGLRenderingContext.SAMPLER_2D,
	Sampler2D = WebGLRenderingContext.SAMPLER_2D,
	SamplerCube = WebGLRenderingContext.SAMPLER_CUBE,
}

export interface Attribute {
	location: number;
	type: Type;
}

export type AttributeStruct = { [key: string]: Attribute };

export interface UniformBase {
	type: Type;
	location: WebGLUniformLocation;
	value?: number | number[] | Texture;
	slot?: number;
}

export type UniformStruct = { [key: string]: Uniform };

export type Uniform = UniformBase | UniformBase[] | UniformStruct;

function isUniformBase(uniform: any): uniform is UniformBase {
	return typeof uniform.type === 'number' && uniform.location instanceof WebGLUniformLocation;
}

function isSampler(type: number): boolean {
	return type === Type.Sampler || type === Type.Sampler2D || type === Type.SamplerCube;
}

export enum MaterialSide {
	FRONT = WebGLRenderingContext.FRONT,
	BACK = WebGLRenderingContext.BACK,
	BOTH = WebGLRenderingContext.FRONT_AND_BACK,
}

export enum MaterialBlend {
	ZERO = WebGLRenderingContext.ZERO,
	ONE = WebGLRenderingContext.ONE,
	SRC_COLOR = WebGLRenderingContext.SRC_COLOR,
	ONE_MINUS_SRC_COLOR = WebGLRenderingContext.ONE_MINUS_SRC_COLOR,
	DST_COLOR = WebGLRenderingContext.DST_COLOR,
	ONE_MINUS_DST_COLOR = WebGLRenderingContext.ONE_MINUS_DST_COLOR,
	SRC_ALPHA = WebGLRenderingContext.SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA = WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
	DST_ALPHA = WebGLRenderingContext.DST_ALPHA,
	ONE_MINUS_DST_ALPHA = WebGLRenderingContext.ONE_MINUS_DST_ALPHA,
	CONSTANT_COLOR = WebGLRenderingContext.CONSTANT_COLOR,
	ONE_MINUS_CONSTANT_COLOR = WebGLRenderingContext.ONE_MINUS_CONSTANT_COLOR,
	CONSTANT_ALPHA = WebGLRenderingContext.CONSTANT_ALPHA,
	ONE_MINUS_CONSTANT_ALPHA = WebGLRenderingContext.ONE_MINUS_CONSTANT_ALPHA,
	SRC_ALPHA_SATURATE = WebGLRenderingContext.SRC_ALPHA_SATURATE,
}

export enum MaterialDepth {
	NEVER = WebGLRenderingContext.NEVER,
	LESS = WebGLRenderingContext.LESS,
	EQUAL = WebGLRenderingContext.EQUAL,
	LEQUAL = WebGLRenderingContext.LEQUAL,
	GREATER = WebGLRenderingContext.GREATER,
	NOTEQUAL = WebGLRenderingContext.NOTEQUAL,
	GEQUAL = WebGLRenderingContext.GEQUAL,
	ALWAYS = WebGLRenderingContext.ALWAYS,
}

export class Material implements IDisposable {
	/** @internal */
	public static currentMaterial?: Material;

	public static override?: Material;
	public static readonly globals: Map<string, any> = new Map();

	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly attributes: AttributeStruct = {};
	public readonly program?: WebGLProgram;
	public readonly queue: number = 0;
	public readonly uniforms: UniformStruct = {};
	protected readonly uniformsInitializer: Map<string, any> = new Map();

	public readonly side: MaterialSide = MaterialSide.BOTH;
	public readonly depthTest: boolean = true;
	public readonly writeDepth: boolean = true;
	public readonly blend: boolean = false;
	public readonly depthFunc: MaterialDepth = MaterialDepth.LESS;
	public readonly blendFuncSource: MaterialBlend = MaterialBlend.ONE;
	public readonly blendFuncDestination: MaterialBlend = MaterialBlend.ZERO;

	constructor(
		public readonly vertexShader: VertexShader,
		public readonly fragmentShader: FragmentShader,
		options?: Partial<
			Pick<
				Material,
				'side' | 'depthTest' | 'writeDepth' | 'blend' | 'depthFunc' | 'blendFuncSource' | 'blendFuncDestination'
			>
		>
	) {
		if (options) {
			for (const key in options) {
				this[key] = options[key];
			}
		}
	}

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
		if (Material.override) {
			return Material.override.bind(gl);
		}

		this.createProgram(gl);

		if (Material.currentMaterial !== this) {
			Material.currentMaterial = this;
			Mesh.currentMesh = undefined;
			gl.useProgram(this.program!);
			if (this.side === MaterialSide.BOTH) {
				gl.disable(gl.CULL_FACE);
			} else {
				gl.enable(gl.CULL_FACE);
				gl.cullFace(this.side);
			}
			if (this.depthTest) {
				gl.enable(gl.DEPTH_TEST);
			} else {
				gl.disable(gl.DEPTH_TEST);
			}
			if (this.writeDepth) {
				gl.depthMask(true);
			} else {
				gl.depthMask(false);
			}
			if (this.blend) {
				gl.enable(gl.BLEND);
				gl.blendFunc(this.blendFuncSource, this.blendFuncDestination);
			} else {
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
		for (let i = 0, l = gl.getProgramParameter(this.program!, gl.ACTIVE_ATTRIBUTES); i < l; ++i) {
			const info = gl.getActiveAttrib(this.program!, i);
			if (info) {
				const loc = gl.getAttribLocation(this.program!, info.name);
				if (!isNull(loc)) {
					this.attributes[info.name] = {
						location: loc,
						type: info.type,
					};
				}
			}
		}

		for (let i = 0, l = gl.getProgramParameter(this.program!, gl.ACTIVE_UNIFORMS); i < l; ++i) {
			const info = gl.getActiveUniform(this.program!, i);
			if (info) {
				const loc = gl.getUniformLocation(this.program!, info.name);
				if (loc) {
					setPath(this.uniforms, info.name, {
						type: info.type,
						location: loc,
						value: undefined,
						slot: isSampler(info.type) ? textureUnits++ : undefined,
					});
				}
			}
		}

		for (const [name, value] of this.uniformsInitializer) {
			this.setUniform(name, value);
		}
		this.uniformsInitializer.clear();

		gl.useProgram(null);

		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
	}

	setUniform(name: string, value: any) {
		if (typeof this.uniforms[name] === 'undefined') {
			this.uniformsInitializer.set(name, value);
		} else {
			const uniform = this.uniforms[name];
			this.setUniformValue(uniform, name, value);
		}
	}

	protected setUniformValue(uniform: Uniform, name: string, value: any) {
		if (isUniformBase(uniform)) {
			uniform.value = value;
		} else if (isArray(uniform)) {
			if (isArray<any>(value)) {
				for (let i = 0, l = value.length; i < l; ++i) {
					this.setUniformValue(uniform[i], name, value[i]);
				}
			}
		} else {
			for (const key in uniform) {
				this.setUniformValue(uniform[key], name, value[key]);
			}
		}
	}

	updateUniforms() {
		if (this.gl) {
			for (const [name, value] of Material.globals) {
				if (typeof this.uniforms[name] !== 'undefined') {
					this.setUniformValue(this.uniforms[name], name, value);
				}
			}
			for (const name in this.uniforms) {
				this.updateUniform(this.uniforms[name], name);
			}
		}
	}

	protected updateUniform(uniform: Uniform, name: string) {
		if (isUniformBase(uniform)) {
			this.updateUniformBase(uniform, name);
		} else if (uniform instanceof Array) {
			for (let i = 0, l = uniform.length; i < l; ++i) {
				this.updateUniform(uniform[i], `${name}[${i}]`);
			}
		} else {
			for (const key in uniform) {
				this.updateUniform(uniform[key], `${name}.${key}`);
			}
		}
	}

	protected updateUniformBase(uniform: UniformBase, name: string) {
		if (this.gl) {
			const gl = this.gl;

			switch (uniform.type) {
				case Type.Sampler:
				case Type.Sampler2D:
				case Type.SamplerCube:
					if (uniform.value instanceof Texture && typeof uniform.slot === 'number') {
						gl.uniform1i(uniform.location, uniform.slot!);
						uniform.value.bind(gl, uniform.slot!);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be a Texture.`);
					}
					break;
				case Type.Int:
					if (isArray(uniform.value)) {
						gl.uniform1iv(uniform.location, uniform.value);
					} else if (typeof uniform.value === 'number') {
						gl.uniform1i(uniform.location, uniform.value);
					}
					break;
				case Type.Float:
					if (isArray(uniform.value)) {
						gl.uniform1fv(uniform.location, uniform.value);
					} else if (typeof uniform.value === 'number') {
						gl.uniform1f(uniform.location, uniform.value);
					}
					break;
				case Type.IVec2:
					if (isArray(uniform.value)) {
						gl.uniform2iv(uniform.location, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.IVec3:
					if (isArray(uniform.value)) {
						gl.uniform3iv(uniform.location, uniform.value);
					} else if (uniform.value) {
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
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Vec3:
					if (isArray(uniform.value)) {
						gl.uniform3fv(uniform.location, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Vec4:
					if (isArray(uniform.value)) {
						gl.uniform4fv(uniform.location, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat2:
					if (isArray(uniform.value)) {
						// gl.uniformMatrix2fv(uniform.location, uniform.transpose === true, uniform.value);
						gl.uniformMatrix2fv(uniform.location, false, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat3:
					if (isArray(uniform.value)) {
						// gl.uniformMatrix3fv(uniform.location, uniform.transpose === true, uniform.value);
						gl.uniformMatrix3fv(uniform.location, false, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
				case Type.Mat4:
					if (isArray(uniform.value)) {
						// gl.uniformMatrix4fv(uniform.location, uniform.transpose === true, uniform.value);
						gl.uniformMatrix4fv(uniform.location, false, uniform.value);
					} else if (uniform.value) {
						throw new SyntaxError(`Expected uniform ${name} to be an array of number.`);
					}
					break;
			}
		}
	}
}
