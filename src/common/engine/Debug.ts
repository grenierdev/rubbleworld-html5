import { Vector3 } from "./math/Vector3";
import { Color } from "./math/Color";
import { Matrix4 } from "./math/Matrix4";
import * as assert from "assert";
import { Shader } from "./rendering/Shader";
import { Material } from "./rendering/Material";
import { Mesh, PointMesh } from "./rendering/Mesh";
import { ArrayVariableManager, ArrayBlock } from "./util/ArrayManager";

enum DebugType {
	Points,
	Line,
	Triangles
}

type DebugPrimitive = DebugPrimitivePoint | DebugPrimitiveLine | DebugPrimitiveTriangles;

interface DebugPrimitiveBase<T> {
	ttl: number
	type: T
}

interface DebugPrimitivePoint extends DebugPrimitiveBase<DebugType.Points> {
	block: ArrayBlock<DataStruct, DataItem>
}

interface DebugPrimitiveLine extends DebugPrimitiveBase<DebugType.Line> {
	block: ArrayBlock<Float32Array>
}

interface DebugPrimitiveTriangles extends DebugPrimitiveBase<DebugType.Triangles> {
	block: ArrayBlock<Float32Array>
}

export interface DebugDrawOptions {
	color?: Color
	matrix?: Matrix4
	ttl?: number
}

export class Debug {
	private static stack: DebugPrimitive[] = [];
	private static gl: WebGLRenderingContext | undefined;
	private static pointMaterial: Material | undefined;
	private static pointManager: PointMeshManager | undefined;
	private static pointMesh: PointMesh | undefined;
	private static pointNeedsUpdate = false;

	public static log(...args: any[]) {
		console.log.apply(console, args);
	}

	public static setRenderingContext(gl: WebGLRenderingContext) {
		Debug.gl = gl;
		Debug.pointMaterial = new Material(
			gl,
			`
				attribute vec3 pointPosition;
				attribute float pointSize;
				attribute vec4 pointColor;

				varying vec4 fragColor;

				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;
				uniform mat4 worldMatrix;

				void main(void) {
					fragColor = pointColor;
					gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(pointPosition, 1.0);
					gl_PointSize = pointSize;
				}
			`,
			`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
			`
		);

		Debug.pointManager = new PointMeshManager({
			positions: new Float32Array(1000 * 3),
			sizes: new Float32Array(1000 * 1),
			colors: new Float32Array(1000 * 4)
		}, 1000, 100);

		Debug.pointMesh = new PointMesh(gl, {
			count: 0,
			positions: Debug.pointManager.data.positions,
			sizes: Debug.pointManager.data.sizes,
			colors: Debug.pointManager.data.colors
		}, true);
	}

	public static draw(viewMatrix: Matrix4, projMatrix: Matrix4) {
		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
		
		const gl = Debug.gl!;

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);

		if (Debug.pointNeedsUpdate) {
			Debug.pointManager!.defrag();
			Debug.pointMesh!.updateBuffers();
		}

		Debug.pointMaterial!.bind();
		Debug.pointMesh!.data.count = Debug.pointManager!.tail.offset;
		Debug.pointMesh!.draw();
	}

	public static drawPrimitivePoints(positions: number[], radius: number, options: DebugDrawOptions = { }) {
		assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
		if (positions.length >= 3) {
			const color = options.color || Color.White;
			const matrix = options.matrix || Matrix4.Identity;
			const points = [] as DataItem[];
			for (let i = 0, l = positions.length; i < l; i += 3) {
				points.push({
					positions: [positions[i * 3 + 0], positions[i * 3 + 1], positions[i * 3 + 2]],
					colors: [color.r, color.g, color.b, color.a],
					size: radius
				});
			}
			Debug.stack.push({
				ttl: options.ttl || 0,
				type: DebugType.Points,
				block: Debug.pointManager!.alloc(points)
			} as DebugPrimitivePoint);
			Debug.pointNeedsUpdate = true;
		}
	}

	// public static drawPrimitiveLine(positions: number[], options: DebugDrawOptions = { }) {
	// 	assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
	// 	if (positions.length >= 6) {
	// 		Debug.stack.push({
	// 			type: DebugType.Line,
	// 			block: Debug.vertexMemory.alloc(positions),
	// 			color: options.color || Color.White,
	// 			ttl: options.ttl || 0,
	// 			matrix: options.matrix || Matrix4.Identity
	// 		} as DebugPrimitiveLine);
	// 	}
	// }

	// public static drawPrimitiveTriangles(positions: number[], indices: number[], options: DebugDrawOptions = { }) {
	// 	assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
	// 	if (positions.length >= 12) {
	// 		Debug.stack.push({
	// 			indices,
	// 			type: DebugType.Triangles,
	// 			block: Debug.vertexMemory.alloc(positions),
	// 			color: options.color || Color.White,
	// 			ttl: options.ttl || 0,
	// 			matrix: options.matrix || Matrix4.Identity
	// 		} as DebugPrimitiveTriangles);
	// 	}
	// }


	public static drawPoint(position: Vector3, radius: number, options: DebugDrawOptions = { }) {
		return Debug.drawPrimitivePoints([position.x, position.y, position.z], radius, options);
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

interface DataStruct {
	sizes: Float32Array
	positions: Float32Array
	colors: Float32Array
}

interface DataItem {
	size: number
	positions: [number, number, number],
	colors: [number, number, number, number]
}

class PointMeshManager extends ArrayVariableManager<DataStruct, DataItem> {
	resize(data: DataStruct, size: number): DataStruct {
		data.sizes = resizeFloat32Array(data.sizes, size * 1);
		data.positions = resizeFloat32Array(data.positions, size * 3);
		data.colors = resizeFloat32Array(data.colors, size * 4);
		return data;
	}

	move(data: DataStruct, block: ArrayBlock, offset: number) {
		data.sizes.copyWithin(offset * 1, block.offset * 1, block.offset * 1 + block.size * 1);
		data.positions.copyWithin(offset * 3, block.offset * 3, block.offset * 3 + block.size * 3);
		data.colors.copyWithin(offset * 4, block.offset * 4, block.offset * 4 + block.size * 4);
	}

	set(data: DataStruct, index: number, value: DataItem) {
		data.sizes[index * 1 + 0] = value.size;
		data.positions[index * 3 + 0] = value.positions[0];
		data.positions[index * 3 + 1] = value.positions[1];
		data.positions[index * 3 + 2] = value.positions[2];
		data.colors[index * 4 + 0] = value.colors[0];
		data.colors[index * 4 + 1] = value.colors[1];
		data.colors[index * 4 + 2] = value.colors[2];
		data.colors[index * 4 + 3] = value.colors[3];
	}

	get(data: DataStruct, index: number): DataItem {
		return {
			size: data.sizes[index * 1 + 0],
			positions: [data.positions[index * 3 + 0], data.positions[index * 3 + 1], data.positions[index * 3 + 2]],
			colors: [data.colors[index * 4 + 0], data.colors[index * 4 + 1], data.colors[index * 4 + 2], data.colors[index * 4 + 3]]
		};
	}
}

function resizeFloat32Array(data: Float32Array, newSize: number): Float32Array {
	if (data.length === newSize) {
		return data;
	}
	else if (data.length > newSize) {
		return data.slice(newSize);
	}
	else {
		const newData = new Float32Array(newSize);
		newData.set(data, 0);
		return newData;
	}
}

const v0 = new Vector3();