import { IDisposable } from '@konstellio/disposable';
import { Material } from './Material';
import { Mutable } from '../util/Mutable';

export interface IMesh {
	updateBuffers(): void
	bind(): void
	draw(): void
}

export interface MeshData {
	vertices: Float32Array
	indices: Uint16Array
	normals?: Float32Array
	uvs?: Float32Array[]
	colors?: Float32Array[]
}

export class Mesh implements IDisposable, IMesh {
	private disposed: boolean;

	public readonly vertexBuffer: WebGLBuffer;
	public readonly indiceBuffer: WebGLBuffer;
	public readonly indiceCount: number;
	public readonly normalBuffer: WebGLBuffer;
	public readonly uvsBuffer: WebGLBuffer[];
	public readonly colorsBuffer: WebGLBuffer[];

	public static currentMesh: IMesh | undefined;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly data: MeshData,
		public readonly dynamic = false
	) {
		this.disposed = false;

		const drawType = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		this.vertexBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data.vertices, drawType);

		this.indiceBuffer = gl.createBuffer()!;
		this.indiceCount = data.indices.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, drawType);
		
		this.normalBuffer = gl.createBuffer()!;
		if (data.normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data.normals, drawType);
		}

		this.uvsBuffer = [];
		if (data.uvs) {
			for (const uv of data.uvs) {
				const uvBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, uv, drawType);
				this.uvsBuffer.push(uvBuffer);
			}
		}

		this.colorsBuffer = [];
		if (data.colors) {
			for (const color of data.colors) {
				const colorBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, color, drawType);
				this.colorsBuffer.push(colorBuffer);
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	updateBuffers(): void {
		if (this.dynamic === false) {
			throw new SyntaxError(`Can not update a static Mesh.`);
		}
		Mesh.currentMesh = undefined;

		const gl = this.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.vertices);

		(this as Mutable<Mesh>).indiceCount = this.data.indices.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.data.indices);

		if (this.data.normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.normals);
		}

		if (this.data.uvs) {
			for (let i = 0, l = this.data.uvs.length; i < l; ++i) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer[i]);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.uvs[i]);
			}
		}

		if (this.data.colors) {
			for (let i = 0, l = this.data.colors.length; i < l; ++i) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer[i]);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors[i]);
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
		if (Mesh.currentMesh !== this) {
			this.bind();
		}

		this.gl.drawElements(this.gl.TRIANGLES, this.indiceCount, this.gl.UNSIGNED_SHORT, 0);
	}
    
}

export interface PointMeshData {
	count: number
	positions: Float32Array
	sizes?: Float32Array
	colors?: Float32Array
}

export class PointMesh implements IDisposable, IMesh {
	private disposed: boolean;

	public readonly positionBuffer: WebGLBuffer;
	public readonly sizeBuffer: WebGLBuffer;
	public readonly colorBuffer: WebGLBuffer;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly data: PointMeshData,
		public readonly dynamic = false
	) {
		this.disposed = false;

		const drawType = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		this.positionBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data.positions, drawType);

		this.sizeBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data.sizes || new Float32Array(data.positions.length).fill(1.0), drawType);

		this.colorBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		if (data.colors) {
			gl.bufferData(gl.ARRAY_BUFFER, data.colors, drawType);
		} else {
			const colors = data.positions.reduce<Float32Array>((colors, pos, i) => {
				colors[i * 4 + 0] = 1;
				colors[i * 4 + 1] = 1;
				colors[i * 4 + 2] = 1;
				colors[i * 4 + 3] = 1;
				return colors;
			}, new Float32Array(data.positions.length * 4));
			gl.bufferData(gl.ARRAY_BUFFER, colors, drawType);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	updateBuffers(): void {
		if (this.dynamic === false) {
			throw new SyntaxError(`Can not update a static Mesh.`);
		}
		Mesh.currentMesh = undefined;

		const gl = this.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, gl.DYNAMIC_DRAW);
		// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.positions);

		if (this.data.sizes) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.sizes, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.sizes);
		}

		if (this.data.colors) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteBuffer(this.positionBuffer);
			this.gl.deleteBuffer(this.sizeBuffer);
			this.gl.deleteBuffer(this.colorBuffer);
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

				if (material.attributes.has('vertPosition')) {
					const attribute = material.attributes.get('vertPosition')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes.has('vertSize')) {
					const attribute = material.attributes.get('vertSize')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
					gl.vertexAttribPointer(attribute.location, 1, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes.has('vertColor')) {
					const attribute = material.attributes.get('vertColor')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
					gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
			}
		}
	}

	draw(): void {
		if (Mesh.currentMesh !== this) {
			this.bind();
		}

		this.gl.drawArrays(this.gl.POINTS, 0, this.data.count);
	}
}

export interface LineMeshData {
	count: number
	positions: Float32Array
	colors?: Float32Array
}

export class LineMesh implements IDisposable, IMesh {
	private disposed: boolean;

	public readonly positionBuffer: WebGLBuffer;
	public readonly colorBuffer: WebGLBuffer;

	constructor(
		public readonly gl: WebGLRenderingContext,
		public readonly data: LineMeshData,
		public readonly dynamic = false
	) {
		this.disposed = false;

		const drawType = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		this.positionBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data.positions, drawType);

		this.colorBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		if (data.colors) {
			gl.bufferData(gl.ARRAY_BUFFER, data.colors, drawType);
		} else {
			const colors = data.positions.reduce<Float32Array>((colors, pos, i) => {
				colors[i * 4 + 0] = 1;
				colors[i * 4 + 1] = 1;
				colors[i * 4 + 2] = 1;
				colors[i * 4 + 3] = 1;
				return colors;
			}, new Float32Array(data.positions.length * 4));
			gl.bufferData(gl.ARRAY_BUFFER, colors, drawType);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	updateBuffers(): void {
		if (this.dynamic === false) {
			throw new SyntaxError(`Can not update a static Mesh.`);
		}
		Mesh.currentMesh = undefined;

		const gl = this.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, gl.DYNAMIC_DRAW);
		// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.positions);

		if (this.data.colors) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	dispose(): void {
		if (this.disposed === false) {
			this.gl.deleteBuffer(this.positionBuffer);
			this.gl.deleteBuffer(this.colorBuffer);
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

				if (material.attributes.has('vertPosition')) {
					const attribute = material.attributes.get('vertPosition')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes.has('vertColor')) {
					const attribute = material.attributes.get('vertColor')!;
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
					gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
			}
		}
	}

	draw(): void {
		if (Mesh.currentMesh !== this) {
			this.bind();
		}

		this.gl.drawArrays(this.gl.LINES, 0, this.data.count);
	}
}