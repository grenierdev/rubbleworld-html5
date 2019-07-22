import { ArrayVariableManager, ArrayBlock } from './util/ArrayManager';
import { Color, ReadonlyColor } from './math/Color';
import { Matrix4, ReadonlyMatrix4 } from './math/Matrix4';
import { Vector3, ReadonlyVector3 } from './math/Vector3';
import { Material } from './rendering/Material';
import { VertexShader, FragmentShader } from './rendering/Shader';
import { PointMesh, LineMesh } from './rendering/Mesh';

enum DebugType {
	Points,
	Lines,
	Triangles,
}

type DebugPrimitive = DebugPrimitivePoint | DebugPrimitiveLine | DebugPrimitiveTriangles;

interface DebugPrimitiveBase<T> {
	ttl: number;
	type: T;
}

interface DebugPrimitivePoint extends DebugPrimitiveBase<DebugType.Points> {
	block: ArrayBlock<PointArray, PointItem>;
}

interface DebugPrimitiveLine extends DebugPrimitiveBase<DebugType.Lines> {
	block: ArrayBlock<LineArray, LineItem>;
}

interface DebugPrimitiveTriangles extends DebugPrimitiveBase<DebugType.Triangles> {
	block: ArrayBlock<Float32Array>;
}

export interface DebugDrawOptions {
	color?: Color | ReadonlyColor | [number, number, number, number];
	matrix?:
		| Matrix4
		| ReadonlyMatrix4
		| [
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number,
				number
		  ];
	ttl?: number;
}

export class Debug {
	protected stack: DebugPrimitive[];
	protected lastTime: number;
	protected material: Material;
	protected pointNeedsUpdate: boolean;
	protected pointManager: PointMeshManager;
	protected pointMesh: PointMesh;
	protected lineNeedsUpdate: boolean;
	protected lineManager: LineMeshManager;
	protected lineMesh: LineMesh;

	constructor() {
		this.stack = [];
		this.lastTime = 0;
		this.material = new Material(
			new VertexShader(
				`
				attribute vec3 vertPosition;
				attribute float vertSize;
				attribute vec4 vertColor;

				varying vec4 fragColor;

				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;

				void main(void) {
					fragColor = vertColor;
					gl_Position = projectionMatrix * viewMatrix * vec4(vertPosition, 1.0);
					gl_PointSize = vertSize;
				}
			`
			),
			new FragmentShader(
				`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
			`
			)
		);
		this.material.twoSided = true;
		this.material.transparent = true;

		this.pointNeedsUpdate = false;
		this.pointManager = new PointMeshManager(
			{
				positions: new Float32Array(100000 * 3),
				sizes: new Float32Array(100000 * 1),
				colors: new Float32Array(100000 * 4),
			},
			100000,
			100
		);
		this.pointMesh = new PointMesh(
			{
				count: 0,
				positions: this.pointManager.data.positions,
				sizes: this.pointManager.data.sizes,
				colors: this.pointManager.data.colors,
			},
			true
		);

		this.lineNeedsUpdate = false;
		this.lineManager = new LineMeshManager(
			{
				positions: new Float32Array(100000 * 6),
				colors: new Float32Array(100000 * 8),
			},
			100000,
			100
		);
		this.lineMesh = new LineMesh(
			{
				count: 0,
				positions: this.pointManager.data.positions,
				colors: this.pointManager.data.colors,
			},
			true
		);
	}

	public update() {
		const now = performance.now() / 1000;
		const delta = now - this.lastTime;
		this.lastTime = now;

		const oldStack: DebugPrimitive[] = [];
		this.stack = this.stack.reduce(
			(stack, prim) => {
				prim.ttl -= delta;
				if (prim.ttl < 0) {
					oldStack.push(prim);
				} else {
					stack.push(prim);
				}
				return stack;
			},
			[] as DebugPrimitive[]
		);

		for (const prim of oldStack) {
			if (prim.type === DebugType.Points) {
				this.pointNeedsUpdate = true;
			} else if (prim.type === DebugType.Lines) {
				this.lineNeedsUpdate = true;
			}
			prim.block.free();
		}
	}

	public draw(viewMatrix: Matrix4 | ReadonlyMatrix4, projMatrix: Matrix4 | ReadonlyMatrix4, gl: WebGLRenderingContext) {
		if (this.pointNeedsUpdate) {
			this.pointNeedsUpdate = false;
			this.pointManager.defrag();
			this.pointMesh.data.count = this.pointManager.tail.freed
				? this.pointManager.tail.offset
				: this.pointManager.tail.offset + this.pointManager.tail.size;
			this.pointMesh.data.positions = this.pointManager.data.positions;
			this.pointMesh.data.sizes = this.pointManager.data.sizes;
			this.pointMesh.data.colors = this.pointManager.data.colors;
			this.pointMesh.updateBuffers();
		}
		if (this.lineNeedsUpdate) {
			this.lineNeedsUpdate = false;
			this.lineManager.defrag();
			this.lineMesh.data.count = this.lineManager.tail.freed
				? this.lineManager.tail.offset
				: this.lineManager.tail.offset + this.lineManager.tail.size;
			this.lineMesh.data.positions = this.lineManager.data.positions;
			this.lineMesh.data.colors = this.lineManager.data.colors;
			this.lineMesh.updateBuffers();
		}

		this.material.setUniform('viewMatrix', viewMatrix.elements);
		this.material.setUniform('projectionMatrix', projMatrix.elements);
		this.material.bind(gl);

		if (this.pointMesh.data.count > 0) {
			this.pointMesh.draw(gl);
		}
		if (this.lineMesh.data.count > 0) {
			this.lineMesh.draw(gl);
		}
	}

	public drawPrimitivePoints(positions: number[], radius: number, options: DebugDrawOptions = {}) {
		if (positions.length % 3 !== 0) {
			throw RangeError(
				`Debug.drawPrimitivePoints expected a multiple of 3 number for positions, got ${positions.length}.`
			);
		}
		const color = options.color || Color.White;
		// const matrix = options.matrix || Matrix4.Identity;
		const points = [] as PointItem[];
		for (let i = 0, l = positions.length; i < l; i += 3) {
			points.push({
				positions: [positions[i * 3 + 0], positions[i * 3 + 1], positions[i * 3 + 2]],
				colors: color instanceof Color ? [color.r, color.g, color.b, color.a] : color,
				size: radius,
			});
		}
		const block = this.pointManager.alloc(points);
		this.stack.push({
			block,
			ttl: options.ttl || 0,
			type: DebugType.Points,
		} as DebugPrimitivePoint);
		this.pointNeedsUpdate = true;
	}

	public drawPrimitiveLines(positions: number[], options: DebugDrawOptions = {}) {
		if (positions.length % 6 !== 0) {
			throw RangeError(
				`Debug.drawPrimitiveLines expected a multiple of 6 number for positions, got ${positions.length}.`
			);
		}
		const color = options.color || Color.White;
		// const matrix = options.matrix || Matrix4.Identity;
		const lines = [] as LineItem[];
		for (let i = 0, l = positions.length; i < l; i += 6) {
			lines.push({
				positions: [
					positions[i * 3 + 0],
					positions[i * 3 + 1],
					positions[i * 3 + 2],
					positions[i * 3 + 3],
					positions[i * 3 + 4],
					positions[i * 3 + 5],
				],
				colors:
					color instanceof Color
						? [color.r, color.g, color.b, color.a, color.r, color.g, color.b, color.a]
						: ([...color, ...color] as any),
			});
		}
		const block = this.lineManager.alloc(lines);
		this.stack.push({
			block,
			ttl: options.ttl || 0,
			type: DebugType.Lines,
		} as DebugPrimitiveLine);
		this.lineNeedsUpdate = true;
	}

	public drawPoint(position: Vector3 | ReadonlyVector3, radius: number, options: DebugDrawOptions = {}) {
		return this.drawPrimitivePoints([position.x, position.y, position.z], radius, options);
	}

	public drawLine(start: Vector3 | ReadonlyVector3, end: Vector3 | ReadonlyVector3, options: DebugDrawOptions = {}) {
		return this.drawPrimitiveLines([start.x, start.y, start.z, end.x, end.y, end.z], options);
	}
}

interface PointArray {
	sizes: Float32Array;
	positions: Float32Array;
	colors: Float32Array;
}

interface PointItem {
	size: number;
	positions: [number, number, number];
	colors: [number, number, number, number];
}

class PointMeshManager extends ArrayVariableManager<PointArray, PointItem> {
	resize(data: PointArray, size: number): PointArray {
		data.sizes = resizeFloat32Array(data.sizes, size * 1);
		data.positions = resizeFloat32Array(data.positions, size * 3);
		data.colors = resizeFloat32Array(data.colors, size * 4);
		return data;
	}

	move(data: PointArray, block: ArrayBlock, offset: number) {
		data.sizes.copyWithin(offset * 1, block.offset * 1, block.offset * 1 + block.size * 1);
		data.positions.copyWithin(offset * 3, block.offset * 3, block.offset * 3 + block.size * 3);
		data.colors.copyWithin(offset * 4, block.offset * 4, block.offset * 4 + block.size * 4);
	}

	set(data: PointArray, index: number, value: PointItem) {
		data.sizes[index * 1 + 0] = value.size;
		data.positions[index * 3 + 0] = value.positions[0];
		data.positions[index * 3 + 1] = value.positions[1];
		data.positions[index * 3 + 2] = value.positions[2];
		data.colors[index * 4 + 0] = value.colors[0];
		data.colors[index * 4 + 1] = value.colors[1];
		data.colors[index * 4 + 2] = value.colors[2];
		data.colors[index * 4 + 3] = value.colors[3];
	}

	get(data: PointArray, index: number): PointItem {
		return {
			size: data.sizes[index * 1 + 0],
			positions: [data.positions[index * 3 + 0], data.positions[index * 3 + 1], data.positions[index * 3 + 2]],
			colors: [
				data.colors[index * 4 + 0],
				data.colors[index * 4 + 1],
				data.colors[index * 4 + 2],
				data.colors[index * 4 + 3],
			],
		};
	}
}

interface LineArray {
	positions: Float32Array;
	colors: Float32Array;
}

interface LineItem {
	positions: [number, number, number, number, number, number];
	colors: [number, number, number, number, number, number, number, number];
}

class LineMeshManager extends ArrayVariableManager<LineArray, LineItem> {
	resize(data: LineArray, size: number): LineArray {
		data.positions = resizeFloat32Array(data.positions, size * 6);
		data.colors = resizeFloat32Array(data.colors, size * 8);
		return data;
	}

	move(data: LineArray, block: ArrayBlock, offset: number) {
		data.positions.copyWithin(offset * 6, block.offset * 6, block.offset * 6 + block.size * 6);
		data.colors.copyWithin(offset * 8, block.offset * 8, block.offset * 8 + block.size * 8);
	}

	set(data: LineArray, index: number, value: LineItem) {
		data.positions[index * 6 + 0] = value.positions[0];
		data.positions[index * 6 + 1] = value.positions[1];
		data.positions[index * 6 + 2] = value.positions[2];
		data.positions[index * 6 + 3] = value.positions[3];
		data.positions[index * 6 + 4] = value.positions[4];
		data.positions[index * 6 + 5] = value.positions[5];
		data.colors[index * 8 + 0] = value.colors[0];
		data.colors[index * 8 + 1] = value.colors[1];
		data.colors[index * 8 + 2] = value.colors[2];
		data.colors[index * 8 + 3] = value.colors[3];
		data.colors[index * 8 + 4] = value.colors[4];
		data.colors[index * 8 + 5] = value.colors[5];
		data.colors[index * 8 + 6] = value.colors[6];
		data.colors[index * 8 + 7] = value.colors[7];
	}

	get(data: LineArray, index: number): LineItem {
		return {
			positions: [
				data.positions[index * 6 + 0],
				data.positions[index * 6 + 1],
				data.positions[index * 6 + 2],
				data.positions[index * 6 + 3],
				data.positions[index * 6 + 4],
				data.positions[index * 6 + 5],
			],
			colors: [
				data.colors[index * 8 + 0],
				data.colors[index * 8 + 1],
				data.colors[index * 8 + 2],
				data.colors[index * 8 + 3],
				data.colors[index * 8 + 4],
				data.colors[index * 8 + 5],
				data.colors[index * 8 + 6],
				data.colors[index * 8 + 7],
			],
		};
	}
}

function resizeFloat32Array(data: Float32Array, newSize: number): Float32Array {
	if (data.length === newSize) {
		return data;
	} else if (data.length > newSize) {
		return data.slice(newSize);
	} else {
		const newData = new Float32Array(newSize);
		newData.set(data, 0);
		return newData;
	}
}

const v0 = new Vector3();
