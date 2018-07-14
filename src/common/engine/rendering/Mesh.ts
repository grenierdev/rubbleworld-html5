import { IDisposable } from '@konstellio/disposable';
import { Material } from './Material';

export type FloatArray = number[] | Float32Array;
export type UintArray = number[] | Uint16Array;

export interface MeshData {
	vertices: FloatArray
	indices: UintArray
	normals?: FloatArray
	uvs?: FloatArray[]
	colors?: FloatArray[]
}

export class Mesh implements IDisposable {
	private disposed: boolean;

	public readonly vertexBuffer: WebGLBuffer;
	public readonly indiceBuffer: WebGLBuffer;
	public readonly indiceCount: number;
	public readonly normalBuffer: WebGLBuffer | undefined;
	public readonly uvsBuffer: WebGLBuffer[];
	public readonly colorsBuffer: WebGLBuffer[];

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
		const material = Material.currentMaterial;
		if (material) {
			const gl = this.gl;

			if(material.attributeLocations.has('vertPosition')) {
				const indx = material.attributeLocations.get('vertPosition')!;
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
				gl.vertexAttribPointer(indx, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(indx);
			}
			if (this.normalBuffer && material.attributeLocations.has('vertNormal')) {
				const indx = material.attributeLocations.get('vertNormal')!;
				gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
				gl.vertexAttribPointer(indx, 3, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(indx);
			}
			for (let i = 0, l = this.uvsBuffer.length; i < l; ++i) {
				if (material.attributeLocations.has('vertUV' + (i + 1))) {
					const indx = material.attributeLocations.get('vertUV' + (i + 1))!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer[i]);
					gl.vertexAttribPointer(indx, 2, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(indx);
				}
			}
			for (let i = 0, l = this.colorsBuffer.length; i < l; ++i) {
				if (material.attributeLocations.has('vertColor' + (i + 1))) {
					const indx = material.attributeLocations.get('vertColor' + (i + 1))!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer[i]);
					gl.vertexAttribPointer(indx, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(indx);
				}
			}
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
		}
	}

	draw(): void {
		this.gl.drawElements(this.gl.TRIANGLES, this.indiceCount, this.gl.UNSIGNED_SHORT, 0);
	}
    
}