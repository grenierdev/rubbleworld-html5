import { IDisposable } from '@konstellio/disposable';
import { VertexShader, FragmentShader } from './Shader';
import { isArray as isarray, isNull } from 'util';
import { Mesh } from './Mesh';
import { Texture } from './Texture';
import { Mutable } from '../util/Immutable';
import { Matrix3, ReadonlyMatrix3 } from '../math/Matrix3';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Vector2, ReadonlyVector2 } from '../math/Vector2';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Vector4, ReadonlyVector4 } from '../math/Vector4';
import { Euler } from '../math/Euler';
import { Color, ReadonlyColor } from '../math/Color';
import { Quaternion, ReadonlyQuaternion } from '../math/Quaternion';

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

export interface UniformDefinition {
	path: string[];
	type: Type;
	location: WebGLUniformLocation;
	slot?: number;
}

export type UniformPrimitive =
	| number
	| number[]
	| Color
	| ReadonlyColor
	| Vector2
	| ReadonlyVector2
	| Vector3
	| ReadonlyVector3
	| Vector4
	| ReadonlyVector4
	| Quaternion
	| ReadonlyQuaternion
	| Matrix3
	| ReadonlyMatrix3
	| Matrix4
	| ReadonlyMatrix4
	| Texture;

export type UniformMap = {
	[key: string]: Uniform;
};

export type Uniform = UniformPrimitive | UniformPrimitive[] | UniformMap;

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
	public static readonly globals: UniformMap = {};

	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;
	protected uniformsDefinition: UniformDefinition[] = [];

	public readonly attributes: AttributeStruct = {};
	public readonly program?: WebGLProgram;
	public readonly queue: number = 0;
	public readonly uniforms: UniformMap = {};

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
		if (Material.override && Material.override !== this) {
			(Material.override as any).uniforms = this.uniforms;
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
				gl.depthFunc(this.depthFunc);
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
					this.uniformsDefinition.push({
						path: info.name.replace(/\]/g, '').split(/[.\[]/),
						type: info.type,
						location: loc,
						slot: isSampler(info.type) ? textureUnits++ : undefined,
					});
				}
			}
		}

		gl.useProgram(null);

		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
	}

	updateUniforms() {
		if (this.gl) {
			for (const definition of this.uniformsDefinition) {
				this.setUniformFromDefinition(definition, 1, this.uniforms[definition.path[0]]);
			}
		}
	}

	private setUniformFromDefinition(definition: UniformDefinition, path: number, value: undefined | Uniform) {
		if (typeof value === 'undefined') {
			value = get(Material.globals, ...definition.path.slice(0, path));
		}
		if (typeof value === 'undefined' || (value instanceof Array && value.length === 0)) {
			return;
		}
		if (definition.path.length === path) {
			setUniform(this.gl!, definition, value);
		} else {
			this.setUniformFromDefinition(definition, path + 1, value[definition.path[path]]);
		}
	}
}

function get(obj: any, ...props: string[]): any {
	return obj && props.reduce((result, prop) => (result == null ? undefined : result[prop]), obj);
}

function setUniform(gl: WebGLRenderingContext, uniform: UniformDefinition, value: unknown) {
	switch (uniform.type) {
		case Type.Sampler:
		case Type.Sampler2D:
		case Type.SamplerCube:
			if (value instanceof Texture && typeof uniform.slot === 'number') {
				gl.uniform1i(uniform.location, uniform.slot!);
				value.bind(gl, uniform.slot!);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be a Texture.`);
			}
			break;
		case Type.Int:
			if (isArray<number>(value)) {
				gl.uniform1iv(uniform.location, value);
			} else if (typeof value === 'number') {
				gl.uniform1i(uniform.location, value);
			}
			break;
		case Type.Float:
			if (isArray<number>(value)) {
				gl.uniform1fv(uniform.location, value);
			} else if (typeof value === 'number') {
				gl.uniform1f(uniform.location, value);
			}
			break;
		case Type.IVec2:
			if (isArray<number>(value)) {
				gl.uniform2iv(uniform.location, value);
			} else if (value instanceof Vector2) {
				gl.uniform2i(uniform.location, value.x, value.y);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector2 object.`);
			}
			break;
		case Type.IVec3:
			if (isArray<number>(value)) {
				gl.uniform3iv(uniform.location, value);
			} else if (value instanceof Vector3) {
				gl.uniform3i(uniform.location, value.x, value.y, value.z);
			} else if (value instanceof Euler) {
				gl.uniform3i(uniform.location, value.x, value.y, value.z);
			} else if (value instanceof Color) {
				gl.uniform3i(uniform.location, value.r, value.g, value.b);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector3 or Color object.`);
			}
			break;
		case Type.IVec4:
			if (isArray<number>(value)) {
				gl.uniform4iv(uniform.location, value);
			} else if (value instanceof Vector4) {
				gl.uniform4i(uniform.location, value.x, value.y, value.z, value.w);
			} else if (value instanceof Quaternion) {
				gl.uniform4i(uniform.location, value.x, value.y, value.z, value.w);
			} else if (value instanceof Color) {
				gl.uniform4i(uniform.location, value.r, value.g, value.b, value.a);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector4 or Color object.`);
			}
			break;
		case Type.Vec2:
			if (isArray<number>(value)) {
				gl.uniform2fv(uniform.location, value);
			} else if (value instanceof Vector2) {
				gl.uniform2f(uniform.location, value.x, value.y);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector2 object.`);
			}
			break;
		case Type.Vec3:
			if (isArray<number>(value)) {
				gl.uniform3fv(uniform.location, value);
			} else if (value instanceof Vector3) {
				gl.uniform3f(uniform.location, value.x, value.y, value.z);
			} else if (value instanceof Euler) {
				gl.uniform3f(uniform.location, value.x, value.y, value.z);
			} else if (value instanceof Color) {
				gl.uniform3f(uniform.location, value.r, value.g, value.b);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector3 or Color object.`);
			}
			break;
		case Type.Vec4:
			if (isArray<number>(value)) {
				gl.uniform4fv(uniform.location, value);
			} else if (value instanceof Vector4) {
				gl.uniform4f(uniform.location, value.x, value.y, value.z, value.w);
			} else if (value instanceof Quaternion) {
				gl.uniform4f(uniform.location, value.x, value.y, value.z, value.w);
			} else if (value instanceof Color) {
				gl.uniform4f(uniform.location, value.r, value.g, value.b, value.a);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or Vector4 or Color object.`);
			}
			break;
		case Type.Mat2:
			if (isArray<number>(value)) {
				// gl.uniformMatrix2fv(uniform.location, uniform.transpose === true, value);
				gl.uniformMatrix2fv(uniform.location, false, value);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number.`);
			}
			break;
		case Type.Mat3:
			if (isArray<number>(value)) {
				gl.uniformMatrix3fv(uniform.location, false, value);
			} else if (value instanceof Matrix3) {
				gl.uniformMatrix3fv(uniform.location, false, value.elements);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or a Matrix3 object.`);
			}
			break;
		case Type.Mat4:
			if (isArray<number>(value)) {
				gl.uniformMatrix4fv(uniform.location, false, value);
			} else if (value instanceof Matrix4) {
				gl.uniformMatrix4fv(uniform.location, false, value.elements);
			} else if (value) {
				throw new SyntaxError(`Expected uniform ${uniform.path} to be an array of number or a Matrix4 object.`);
			}
			break;
	}
}
