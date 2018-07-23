import { IDisposable } from '@konstellio/disposable';
import { Material } from './Material';

export type FloatArray = number[] | Float32Array;
export type UintArray = number[] | Uint16Array;

export interface IMesh {
	bind(): void
	draw(): void
}

export interface MeshData {
	vertices: FloatArray
	indices: UintArray
	normals?: FloatArray
	uvs?: FloatArray[]
	colors?: FloatArray[]
}

export class Mesh implements IDisposable, IMesh {
	private disposed: boolean;

	public readonly vertexBuffer: WebGLBuffer;
	public readonly indiceBuffer: WebGLBuffer;
	public readonly indiceCount: number;
	public readonly normalBuffer: WebGLBuffer | undefined;
	public readonly uvsBuffer: WebGLBuffer[];
	public readonly colorsBuffer: WebGLBuffer[];

	public static currentMesh: Mesh | undefined;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly data: MeshData,
		public readonly dynamic = false
	) {
		this.disposed = false;

		const drawType = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		this.vertexBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), drawType);

		this.indiceBuffer = gl.createBuffer()!;
		this.indiceCount = data.indices.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), drawType);
		
		if (data.normals) {
			this.normalBuffer = gl.createBuffer()!;
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), drawType);
		}

		this.uvsBuffer = [];
		if (data.uvs) {
			for (const uv of data.uvs) {
				const uvBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), drawType);
				this.uvsBuffer.push(uvBuffer);
			}
		}

		this.colorsBuffer = [];
		if (data.colors) {
			for (const color of data.colors) {
				const colorBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), drawType);
				this.colorsBuffer.push(colorBuffer);
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteBuffer(this.vertexBuffer);
			this.gl.deleteBuffer(this.indiceBuffer);
			if (this.normalBuffer) {
				this.gl.deleteBuffer(this.normalBuffer);
			}
			for (const uvBuffer of this.uvsBuffer) {
				this.gl.deleteBuffer(uvBuffer);
			}
			for (const colorBuffer of this.colorsBuffer) {
				this.gl.deleteBuffer(colorBuffer);
			}
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	bind(): void {
		if (Mesh.currentMesh !== this) {
			Mesh.currentMesh = this;

			const material = Material.currentMaterial;
			if (material) {
				const gl = this.gl;

				if(material.attributes.has('vertPosition')) {
					const attribute = material.attributes.get('vertPosition')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (this.normalBuffer && material.attributes.has('vertNormal')) {
					const attribute = material.attributes.get('vertNormal')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				for (let i = 0, l = this.uvsBuffer.length; i < l; ++i) {
					if (material.attributes.has('vertUV' + (i + 1))) {
						const attribute = material.attributes.get('vertUV' + (i + 1))!;
						gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer[i]);
						gl.vertexAttribPointer(attribute.location, 2, gl.FLOAT, false, 0, 0);
						gl.enableVertexAttribArray(attribute.location);
					}
				}
				for (let i = 0, l = this.colorsBuffer.length; i < l; ++i) {
					if (material.attributes.has('vertColor' + (i + 1))) {
						const attribute = material.attributes.get('vertColor' + (i + 1))!;
						gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer[i]);
						gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
						gl.enableVertexAttribArray(attribute.location);
					}
				}
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
			}
		}
	}

	draw(): void {
		if (Mesh.currentMesh === this) {
			this.gl.drawElements(this.gl.TRIANGLES, this.indiceCount, this.gl.UNSIGNED_SHORT, 0);
		}
	}
    
}