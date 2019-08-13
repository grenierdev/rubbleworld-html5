import { IDisposable } from '@konstellio/disposable';
import { Material } from './Material';
import { Mutable } from '../util/Immutable';

export interface IMesh {
	updateBuffers(): void;
	bind(gl: WebGLRenderingContext): void;
	draw(gl: WebGLRenderingContext): void;
}

export interface MeshData {
	vertices: Float32Array;
	indices: Uint16Array;
	normals?: Float32Array;
	uvs?: Float32Array[];
	colors?: Float32Array[];
}

export class Mesh implements IDisposable, IMesh {
	public static currentMesh?: IMesh;

	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly vertexBuffer?: WebGLBuffer;
	public readonly indiceBuffer?: WebGLBuffer;
	public readonly indiceCount: number = 0;
	public readonly normalBuffer?: WebGLBuffer;
	public readonly uvsBuffer: WebGLBuffer[] = [];
	public readonly colorsBuffer: WebGLBuffer[] = [];

	constructor(public readonly data: MeshData, public readonly dynamic = false) {}

	protected createBuffers(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`Mesh already compiled with an other WebGLRenderingContext.`);
		}

		if (this.vertexBuffer) {
			return;
		}

		this.gl = gl;

		const drawType = this.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		(this as Mutable<Mesh>).vertexBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.vertices, drawType);

		(this as Mutable<Mesh>).indiceBuffer = gl.createBuffer()!;
		(this as Mutable<Mesh>).indiceCount = this.data.indices.length;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer!);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data.indices, drawType);

		(this as Mutable<Mesh>).normalBuffer = gl.createBuffer()!;
		if (this.data.normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer!);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.normals, drawType);
		}

		(this as Mutable<Mesh>).uvsBuffer = [];
		if (this.data.uvs) {
			for (const uv of this.data.uvs) {
				const uvBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, uv, drawType);
				this.uvsBuffer.push(uvBuffer);
			}
		}

		(this as Mutable<Mesh>).colorsBuffer = [];
		if (this.data.colors) {
			for (const color of this.data.colors) {
				const colorBuffer = gl.createBuffer()!;
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, color, drawType);
				this.colorsBuffer.push(colorBuffer);
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	updateBuffers() {
		if (this.gl) {
			if (this.dynamic === false) {
				throw new SyntaxError(`Can not update a static Mesh.`);
			}
			Mesh.currentMesh = undefined;

			const gl = this.gl;

			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.vertices, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.vertices);

			(this as Mutable<Mesh>).indiceCount = this.data.indices.length;
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer!);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data.indices, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.data.indices);

			if (this.data.normals) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer!);
				gl.bufferData(gl.ARRAY_BUFFER, this.data.normals, gl.DYNAMIC_DRAW);
				// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.normals);
			}

			if (this.data.uvs) {
				for (let i = 0, l = this.data.uvs.length; i < l; ++i) {
					gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer[i]);
					gl.bufferData(gl.ARRAY_BUFFER, this.data.uvs[i], gl.DYNAMIC_DRAW);
					// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.uvs[i]);
				}
			}

			if (this.data.colors) {
				for (let i = 0, l = this.data.colors.length; i < l; ++i) {
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer[i]);
					gl.bufferData(gl.ARRAY_BUFFER, this.data.colors[i], gl.DYNAMIC_DRAW);
					// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors[i]);
				}
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
	}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl) {
				this.gl.deleteBuffer(this.vertexBuffer!);
				this.gl.deleteBuffer(this.indiceBuffer!);
				if (this.normalBuffer) {
					this.gl.deleteBuffer(this.normalBuffer);
				}
				for (const uvBuffer of this.uvsBuffer) {
					this.gl.deleteBuffer(uvBuffer);
				}
				for (const colorBuffer of this.colorsBuffer) {
					this.gl.deleteBuffer(colorBuffer);
				}
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext) {
		this.createBuffers(gl);

		if (Mesh.currentMesh !== this) {
			Mesh.currentMesh = this;

			const material = Material.currentMaterial;
			if (material) {
				const gl = this.gl!;

				if (material.attributes['Position0']) {
					const attribute = material.attributes['Position0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer!);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (this.normalBuffer && material.attributes['Normal0']) {
					const attribute = material.attributes['Normal0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				for (let i = 0, l = this.uvsBuffer.length; i < l; ++i) {
					if (material.attributes['UV' + i]) {
						const attribute = material.attributes['UV' + i];
						gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer[i]);
						gl.vertexAttribPointer(attribute.location, 2, gl.FLOAT, false, 0, 0);
						gl.enableVertexAttribArray(attribute.location);
					}
				}
				for (let i = 0, l = this.colorsBuffer.length; i < l; ++i) {
					if (material.attributes['Color' + i]) {
						const attribute = material.attributes['Color' + i];
						gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBuffer[i]);
						gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
						gl.enableVertexAttribArray(attribute.location);
					}
				}
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer!);
			}
		}
	}

	draw(gl: WebGLRenderingContext) {
		if (Mesh.currentMesh !== this) {
			this.bind(gl);
		}

		gl.drawElements(gl.TRIANGLES, this.indiceCount, gl.UNSIGNED_SHORT, 0);
	}
}

export interface PointMeshData {
	count: number;
	positions: Float32Array;
	sizes?: Float32Array;
	colors?: Float32Array;
}

export class PointMesh implements IDisposable, IMesh {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly positionBuffer?: WebGLBuffer;
	public readonly sizeBuffer?: WebGLBuffer;
	public readonly colorBuffer?: WebGLBuffer;

	constructor(public readonly data: PointMeshData, public readonly dynamic = false) {}

	protected createBuffers(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`PointMesh already compiled with an other WebGLRenderingContext.`);
		}

		if (this.positionBuffer) {
			return;
		}

		this.gl = gl;

		const drawType = this.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		(this as Mutable<PointMesh>).positionBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, drawType);

		(this as Mutable<PointMesh>).sizeBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer!);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.sizes || new Float32Array(this.data.positions.length).fill(1.0), drawType);

		(this as Mutable<PointMesh>).colorBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
		if (this.data.colors) {
			gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, drawType);
		} else {
			const colors = this.data.positions.reduce<Float32Array>((colors, pos, i) => {
				colors[i * 4 + 0] = 1;
				colors[i * 4 + 1] = 1;
				colors[i * 4 + 2] = 1;
				colors[i * 4 + 3] = 1;
				return colors;
			}, new Float32Array(this.data.positions.length * 4));
			gl.bufferData(gl.ARRAY_BUFFER, colors, drawType);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	updateBuffers() {
		if (this.gl) {
			if (this.dynamic === false) {
				throw new SyntaxError(`Can not update a static Mesh.`);
			}
			Mesh.currentMesh = undefined;

			const gl = this.gl;

			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.positions);

			if (this.data.sizes) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer!);
				gl.bufferData(gl.ARRAY_BUFFER, this.data.sizes, gl.DYNAMIC_DRAW);
				// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.sizes);
			}

			if (this.data.colors) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
				gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, gl.DYNAMIC_DRAW);
				// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl) {
				this.gl.deleteBuffer(this.positionBuffer!);
				this.gl.deleteBuffer(this.sizeBuffer!);
				this.gl.deleteBuffer(this.colorBuffer!);
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext) {
		this.createBuffers(gl);

		if (Mesh.currentMesh !== this) {
			Mesh.currentMesh = this;

			const material = Material.currentMaterial;
			if (material) {
				const gl = this.gl!;

				if (material.attributes['Position0']) {
					const attribute = material.attributes['Position0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes['Size']) {
					const attribute = material.attributes['Size'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer!);
					gl.vertexAttribPointer(attribute.location, 1, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes['Color0']) {
					const attribute = material.attributes['Color0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
					gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
			}
		}
	}

	draw(gl: WebGLRenderingContext) {
		if (Mesh.currentMesh !== this) {
			this.bind(gl);
		}

		gl.drawArrays(gl.POINTS, 0, this.data.count);
	}
}

export interface LineMeshData {
	count: number;
	positions: Float32Array;
	colors?: Float32Array;
}

export class LineMesh implements IDisposable, IMesh {
	private disposed: boolean = false;
	protected gl?: WebGLRenderingContext;

	public readonly positionBuffer?: WebGLBuffer;
	public readonly colorBuffer?: WebGLBuffer;

	constructor(public readonly data: LineMeshData, public readonly dynamic = false) {}

	protected createBuffers(gl: WebGLRenderingContext) {
		if (this.gl && this.gl !== gl) {
			throw new ReferenceError(`LineMesh already compiled with an other WebGLRenderingContext.`);
		}

		if (this.positionBuffer) {
			return;
		}

		this.gl = gl;

		const drawType = this.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

		(this as Mutable<LineMesh>).positionBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, drawType);

		(this as Mutable<LineMesh>).colorBuffer = gl.createBuffer()!;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
		if (this.data.colors) {
			gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, drawType);
		} else {
			const colors = this.data.positions.reduce<Float32Array>((colors, pos, i) => {
				colors[i * 4 + 0] = 1;
				colors[i * 4 + 1] = 1;
				colors[i * 4 + 2] = 1;
				colors[i * 4 + 3] = 1;
				return colors;
			}, new Float32Array(this.data.positions.length * 4));
			gl.bufferData(gl.ARRAY_BUFFER, colors, drawType);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	updateBuffers() {
		if (this.gl) {
			if (this.dynamic === false) {
				throw new SyntaxError(`Can not update a static Mesh.`);
			}
			Mesh.currentMesh = undefined;

			const gl = this.gl;

			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
			gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, gl.DYNAMIC_DRAW);
			// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.positions);

			if (this.data.colors) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
				gl.bufferData(gl.ARRAY_BUFFER, this.data.colors, gl.DYNAMIC_DRAW);
				// gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.colors);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}

	async dispose() {
		if (this.disposed === false) {
			if (this.gl) {
				this.gl.deleteBuffer(this.positionBuffer!);
				this.gl.deleteBuffer(this.colorBuffer!);
			}
			this.disposed = true;
		}
	}

	isDisposed() {
		return this.disposed;
	}

	bind(gl: WebGLRenderingContext) {
		this.createBuffers(gl);

		if (Mesh.currentMesh !== this) {
			Mesh.currentMesh = this;

			const material = Material.currentMaterial;
			if (material) {
				const gl = this.gl!;

				if (material.attributes['Position0']) {
					const attribute = material.attributes['Position0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer!);
					gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
				if (material.attributes['Color0']) {
					const attribute = material.attributes['Color0'];
					gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer!);
					gl.vertexAttribPointer(attribute.location, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(attribute.location);
				}
			}
		}
	}

	draw(gl: WebGLRenderingContext) {
		if (Mesh.currentMesh !== this) {
			this.bind(gl);
		}

		gl.drawArrays(gl.LINES, 0, this.data.count * 2);
	}
}
