import { Vector3 } from "./math/Vector3";
import { Color } from "./math/Color";
import { Matrix4 } from "./math/Matrix4";
import { MemoryAddress, MemoryBlock } from "./util/Memory";
import * as assert from "assert";
import { Shader } from "./rendering/Shader";
import { Material } from "./rendering/Material";
import { Mesh } from "./rendering/Mesh";

enum DebugType {
	Points,
	Line,
	Triangles
}

type DebugPrimitive = DebugPrimitivePoint | DebugPrimitiveLine | DebugPrimitiveTriangles;

interface DebugPrimitiveBase<T> {
	ttl: number
	type: T
	color: Color
	matrix: Matrix4
}

interface DebugPrimitivePoint extends DebugPrimitiveBase<DebugType.Points> {
	// point: number[]
	block: MemoryBlock<Float32Array>
	radius: number
}

interface DebugPrimitiveLine extends DebugPrimitiveBase<DebugType.Line> {
	// points: number[]
	block: MemoryBlock<Float32Array>
}

interface DebugPrimitiveTriangles extends DebugPrimitiveBase<DebugType.Triangles> {
	// points: number[]
	// indices: number[]
	block: MemoryBlock<Float32Array>
}

export interface DebugDrawOptions {
	color?: Color
	matrix?: Matrix4
	ttl?: number
}

export class Debug {
	private static stack: DebugPrimitive[] = [];
	private static gl: WebGLRenderingContext | undefined;
	private static vertexMemory: MemoryAddress<Float32Array> = new MemoryAddress<Float32Array>(1000000 / 32, 10000 / 32, Float32Array);
	private static vertexBuffer: WebGLBuffer | undefined;
	private static vertexArray: Float32Array | undefined;
	private static material: Material | undefined;
	private static vertPositionLoc: number;
	private static pointRadiusLoc: WebGLUniformLocation | undefined;
	private static pointColorLoc: WebGLUniformLocation | undefined;
	private static projectionMatrixLoc: WebGLUniformLocation | undefined;
	private static viewMatrixLoc: WebGLUniformLocation | undefined;
	private static worldMatrixLoc: WebGLUniformLocation | undefined;

	public static log(...args: any[]) {
		console.log.apply(console, args);
	}

	public static setRenderingContext(gl: WebGLRenderingContext) {
		Debug.gl = gl;
		Debug.material = new Material(
			gl,
			`
				attribute vec3 vertPosition;

				varying vec4 fragColor;

				uniform float pointRadius;
				uniform vec4 pointColor;

				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;
				uniform mat4 worldMatrix;

				void main(void) {
					fragColor = pointColor;
					gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertPosition, 1.0);
					gl_PointSize = pointRadius;
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

		Debug.vertPositionLoc = Debug.material!.attributes.get('vertPosition')!.location;
		Debug.pointRadiusLoc = Debug.material!.uniforms.get('pointRadius')!.location;
		Debug.pointColorLoc = Debug.material!.uniforms.get('pointColor')!.location;
		Debug.projectionMatrixLoc = Debug.material!.uniforms.get('projectionMatrix')!.location;
		Debug.viewMatrixLoc = Debug.material!.uniforms.get('viewMatrix')!.location;
		Debug.worldMatrixLoc = Debug.material!.uniforms.get('worldMatrix')!.location;
	}

	public static draw(viewMatrix: Matrix4, projMatrix: Matrix4) {
		Material.currentMaterial = undefined;
		Mesh.currentMesh = undefined;
		
		const gl = Debug.gl!;

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);

		if (Debug.vertexArray !== Debug.vertexMemory.buffer) {
			Debug.vertexArray = Debug.vertexMemory.buffer;
			if (Debug.vertexBuffer) {
				gl.deleteBuffer(Debug.vertexBuffer);
			}
			Debug.vertexBuffer = gl.createBuffer()!;
			gl.bindBuffer(gl.ARRAY_BUFFER, Debug.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Debug.vertexArray, gl.DYNAMIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

		gl.useProgram(Debug.material!.program);

		gl.bindBuffer(gl.ARRAY_BUFFER, Debug.vertexBuffer!);
		gl.vertexAttribPointer(Debug.vertPositionLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(Debug.vertPositionLoc);

		gl.uniformMatrix4fv(Debug.projectionMatrixLoc!, false, projMatrix.elements);
		gl.uniformMatrix4fv(Debug.viewMatrixLoc!, false, viewMatrix.elements);
		
		for (const stack of Debug.stack) {
			// debugger;
			gl.uniformMatrix4fv(Debug.worldMatrixLoc!, false, stack.matrix.elements);
			gl.uniform4f(Debug.pointColorLoc!, stack.color.r, stack.color.g, stack.color.b, stack.color.a);
			switch (stack.type) {
				case DebugType.Points:
					gl.uniform1f(Debug.pointRadiusLoc!, stack.radius);
					gl.drawArrays(gl.POINTS, stack.block.offset, stack.block.length);
					break;
				case DebugType.Line:
					gl.drawArrays(gl.LINES, stack.block.offset, stack.block.length);
					break;
				case DebugType.Triangles:
					gl.drawArrays(gl.TRIANGLES, stack.block.offset, stack.block.length);
					break;
			}
		}
	}

	public static drawPrimitivePoints(positions: number[], radius: number, options: DebugDrawOptions = { }) {
		assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
		if (positions.length >= 3) {
			Debug.stack.push({
				radius,
				type: DebugType.Points,
				block: Debug.vertexMemory.alloc(positions),
				color: options.color || Color.White,
				ttl: options.ttl || 0,
				matrix: options.matrix || Matrix4.Identity
			} as DebugPrimitivePoint);
		}
	}

	public static drawPrimitiveLine(positions: number[], options: DebugDrawOptions = { }) {
		assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
		if (positions.length >= 6) {
			Debug.stack.push({
				type: DebugType.Line,
				block: Debug.vertexMemory.alloc(positions),
				color: options.color || Color.White,
				ttl: options.ttl || 0,
				matrix: options.matrix || Matrix4.Identity
			} as DebugPrimitiveLine);
		}
	}

	public static drawPrimitiveTriangles(positions: number[], indices: number[], options: DebugDrawOptions = { }) {
		assert(positions.length % 3 === 0, `Expected positions to contains a multiple of 3 number, one for each axis (x,y,z).`);
		if (positions.length >= 12) {
			Debug.stack.push({
				indices,
				type: DebugType.Triangles,
				block: Debug.vertexMemory.alloc(positions),
				color: options.color || Color.White,
				ttl: options.ttl || 0,
				matrix: options.matrix || Matrix4.Identity
			} as DebugPrimitiveTriangles);
		}
	}


	public static drawPoint(position: Vector3, radius: number, options: DebugDrawOptions = { }) {
		return Debug.drawPrimitivePoints([position.x, position.y, position.z], radius, options);
	}

	public static drawBox(min: Vector3, max: Vector3, options: DebugDrawOptions = { }) {

	}

	public static drawCube(center: Vector3, size: number, options: DebugDrawOptions = { }) {
		return Debug.drawBox(
			v0.copy(center).subScalar(size),
			v0.copy(center).addScalar(size),
			options
		);
	}

}

const v0 = new Vector3();