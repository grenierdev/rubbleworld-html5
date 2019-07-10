import { Vector3 } from './math/Vector3';
import { Color } from './math/Color';
import { Matrix4 } from './math/Matrix4';
import { ok as assert } from 'assert';
import { Shader, ShaderType } from './rendering/Shader';
import { Material } from './rendering/Material';
import { Mesh, PointMesh, LineMesh } from './rendering/Mesh';
import { ArrayVariableManager, ArrayBlock } from './util/ArrayManager';

enum DebugType {
	Points,
	Line,
	Triangles,
}

type DebugPrimitive =
	| DebugPrimitivePoint
	| DebugPrimitiveLine
	| DebugPrimitiveTriangles;

interface DebugPrimitiveBase<T> {
	ttl: number;
	type: T;
}

interface DebugPrimitivePoint extends DebugPrimitiveBase<DebugType.Points> {
	block: ArrayBlock<PointArray, PointItem>;
}

interface DebugPrimitiveLine extends DebugPrimitiveBase<DebugType.Line> {
	block: ArrayBlock<LineArray, LineItem>;
}

interface DebugPrimitiveTriangles
	extends DebugPrimitiveBase<DebugType.Triangles> {
	block: ArrayBlock<Float32Array>;
}

export interface DebugDrawOptions {
	color?: Color | [number, number, number, number];
	matrix?:
		| Matrix4
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
	private static stack: DebugPrimitive[] = [];
	private static lastTime = performance.now() / 1000;
	private static gl: WebGLRenderingContext | undefined;
	private static material: Material | undefined;
	private static pointManager: PointMeshManager | undefined;
	private static pointMesh: PointMesh | undefined;
	private static pointNeedsUpdate = false;
	private static lineManager: LineMeshManager | undefined;
	private static lineMesh: LineMesh | undefined;
	private static lineNeedsUpdate = false;

	public static log(...args: any[]) {
		console.log(...args);
	}

	public static setRenderingContext(gl: WebGLRenderingContext) {
		Debug.gl = gl;

		Debug.material = new Material(
			new Shader(
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
			`,
				ShaderType.Vertex
			),
			new Shader(
				`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
			`,
				ShaderType.Fragment
			)
		);
		Debug.material.twoSided = true;
		Debug.material.transparent = true;

		Debug.pointManager = new PointMeshManager(
			{
				positions: new Float32Array(100000 * 3),
				sizes: new Float32Array(100000 * 1),
				colors: new Float32Array(100000 * 4),
			},
			100000,
			100
		);

		Debug.pointMesh = new PointMesh(
			{
				count: 0,
				positions: Debug.pointManager.data.positions,
				sizes: Debug.pointManager.data.sizes,
				colors: Debug.pointManager.data.colors,
			},
			true
		);

		Debug.lineManager = new LineMeshManager(
			{
				positions: new Float32Array(100000 * 6),
				colors: new Float32Array(100000 * 8),
			},
			100000,
			100
		);

		Debug.lineMesh = new LineMesh(
			{
				count: 0,
				positions: Debug.pointManager.data.positions,
				colors: Debug.pointManager.data.colors,
			},
			true
		);
	}

	public static update() {
		const now = performance.now() / 1000;
		const delta = now - Debug.lastTime;
		Debug.lastTime = now;

		const oldStack: DebugPrimitive[] = [];
		Debug.stack = Debug.stack.reduce(
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
				Debug.pointNeedsUpdate = true;
			}
			prim.block.free();
		}
	}

	public static draw(viewMatrix: Matrix4, projMatrix: Matrix4) {
		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;

		const gl = Debug.gl!;

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);

		if (Debug.pointNeedsUpdate) {
			Debug.pointNeedsUpdate = false;
			Debug.pointManager!.defrag();
			Debug.pointMesh!.data.count = Debug.pointManager!.tail.freed
				? Debug.pointManager!.tail.offset
				: Debug.pointManager!.tail.offset + Debug.pointManager!.tail.size;
			Debug.pointMesh!.data.positions = Debug.pointManager!.data.positions;
			Debug.pointMesh!.data.sizes = Debug.pointManager!.data.sizes;
			Debug.pointMesh!.data.colors = Debug.pointManager!.data.colors;
			Debug.pointMesh!.updateBuffers();
		}
		if (Debug.lineNeedsUpdate) {
			Debug.lineNeedsUpdate = false;
			Debug.lineManager!.defrag();
			Debug.lineMesh!.data.count = Debug.lineManager!.tail.freed
				? Debug.lineManager!.tail.offset
				: Debug.lineManager!.tail.offset + Debug.lineManager!.tail.size;
			Debug.lineMesh!.data.positions = Debug.lineManager!.data.positions;
			Debug.lineMesh!.data.colors = Debug.lineManager!.data.colors;
			Debug.lineMesh!.updateBuffers();
		}

		Debug.material!.setUniform('viewMatrix', viewMatrix.elements);
		Debug.material!.setUniform('projectionMatrix', projMatrix.elements);
		Debug.material!.bind(gl);

		if (Debug.pointMesh!.data.count > 0) {
			Debug.pointMesh!.draw(gl);
		}
		if (Debug.lineMesh!.data.count > 0) {
			Debug.lineMesh!.draw(gl);
		}
	}

	public static drawPrimitivePoints(
		positions: number[],
		radius: number,
		options: DebugDrawOptions = {}
	) {
		assert(
			positions.length % 3 === 0,
			`Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`
		);
		if (positions.length >= 3) {
			const color = options.color || Color.White;
			// const matrix = options.matrix || Matrix4.Identity;
			const points = [] as PointItem[];
			for (let i = 0, l = positions.length; i < l; i += 3) {
				points.push({
					positions: [
						positions[i * 3 + 0],
						positions[i * 3 + 1],
						positions[i * 3 + 2],
					],
					colors:
						color instanceof Color
							? [color.r, color.g, color.b, color.a]
							: color,
					size: radius,
				});
			}
			const block = Debug.pointManager!.alloc(points);
			Debug.stack.push({
				block,
				ttl: options.ttl || 0,
				type: DebugType.Points,
			} as DebugPrimitivePoint);
			Debug.pointNeedsUpdate = true;
		}
	}

	public static drawPrimitiveLine(
		positions: number[],
		options: DebugDrawOptions = {}
	) {
		assert(
			positions.length % 3 === 0,
			`Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`
		);
		if (positions.length >= 3) {
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
							? [
									color.r,
									color.g,
									color.b,
									color.a,
									color.r,
									color.g,
									color.b,
									color.a,
							  ]
							: ([...color, ...color] as any),
				});
			}
			const block = Debug.lineManager!.alloc(lines);
			Debug.stack.push({
				block,
				ttl: options.ttl || 0,
				type: DebugType.Line,
			} as DebugPrimitiveLine);
			Debug.lineNeedsUpdate = true;
		}
	}

	public static drawPoint(
		position: Vector3,
		radius: number,
		options: DebugDrawOptions = {}
	) {
		return Debug.drawPrimitivePoints(
			[position.x, position.y, position.z],
			radius,
			options
		);
	}

	// public static drawBox(min: Vector3, max: Vector3, options: DebugDrawOptions = { }) {

	// }

	// public static drawCube(center: Vector3, size: number, options: DebugDrawOptions = { }) {
	// 	return Debug.drawBox(
	// 		v0.copy(center).subScalar(size),
	// 		v0.copy(center).addScalar(size),
	// 		options
	// 	);
	// }
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
		data.sizes.copyWithin(
			offset * 1,
			block.offset * 1,
			block.offset * 1 + block.size * 1
		);
		data.positions.copyWithin(
			offset * 3,
			block.offset * 3,
			block.offset * 3 + block.size * 3
		);
		data.colors.copyWithin(
			offset * 4,
			block.offset * 4,
			block.offset * 4 + block.size * 4
		);
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
			positions: [
				data.positions[index * 3 + 0],
				data.positions[index * 3 + 1],
				data.positions[index * 3 + 2],
			],
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
		data.positions.copyWithin(
			offset * 6,
			block.offset * 6,
			block.offset * 6 + block.size * 6
		);
		data.colors.copyWithin(
			offset * 8,
			block.offset * 8,
			block.offset * 8 + block.size * 8
		);
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
