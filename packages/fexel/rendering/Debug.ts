import { ArrayVariableManager, ArrayBlock } from '../util/ArrayManager';
import { Color, ReadonlyColor } from '../math/Color';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Material } from './Material';
import { VertexShader, FragmentShader } from './Shader';
import { PointMesh, LineMesh } from './Mesh';

type DebugPrimitive =
	| DebugPrimitiveBase<'points', { count: number; positions: Float32Array; radius: Float32Array; colors: Float32Array }>
	| DebugPrimitiveBase<'lines', { count: number; vertices: Float32Array; colors: Float32Array }>;
// | DebugPrimitiveBase<'triangles', { vertices: Float32Array, colors: Float32Array }>

type DebugPrimitiveBase<T, D = {}> = { type: T; ttl: number; data: D };

export interface DebugDrawOptions {
	color?: Color | ReadonlyColor;
	matrix?: Matrix4 | ReadonlyMatrix4;
	ttl?: number;
}

const fragShader = new FragmentShader(`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
		`);

export class Debug {
	protected primitiveList: DebugPrimitive[] = [];
	protected lastTime: number = 0;
	protected pointMaterial: Material = new Material(
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
		fragShader
	);
	protected pointMesh: PointMesh = new PointMesh(
		{
			count: 0,
			positions: new Float32Array(),
			sizes: new Float32Array(),
			colors: new Float32Array(),
		},
		true
	);
	protected lineMaterial: Material = new Material(
		new VertexShader(
			`
				attribute vec3 vertPosition;
				attribute vec4 vertColor;

				varying vec4 fragColor;

				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;

				void main(void) {
					fragColor = vertColor;
					gl_Position = projectionMatrix * viewMatrix * vec4(vertPosition, 1.0);
				}
			`
		),
		fragShader
	);
	protected lineMesh: LineMesh = new LineMesh(
		{
			count: 0,
			positions: new Float32Array(),
			colors: new Float32Array(),
		},
		true
	);

	constructor() {
		this.pointMaterial.twoSided = true;
		this.pointMaterial.transparent = true;
		this.lineMaterial.twoSided = true;
		this.lineMaterial.transparent = true;
	}

	public update() {
		const now = performance.now() / 1000;
		const delta = now - this.lastTime;
		this.lastTime = now;

		this.primitiveList = this.primitiveList.reduce(
			(stack, prim) => {
				prim.ttl -= delta;
				if (prim.ttl >= 0) {
					stack.push(prim);
				}
				return stack;
			},
			[] as DebugPrimitive[]
		);
		this.primitiveList.sort((a, b) => a.type.charCodeAt(0) - b.type.charCodeAt(0));
	}

	public draw(viewMatrix: Matrix4 | ReadonlyMatrix4, projMatrix: Matrix4 | ReadonlyMatrix4, gl: WebGLRenderingContext) {
		this.pointMaterial.setUniform('viewMatrix', viewMatrix.elements);
		this.pointMaterial.setUniform('projectionMatrix', projMatrix.elements);
		this.lineMaterial.setUniform('viewMatrix', viewMatrix.elements);
		this.lineMaterial.setUniform('projectionMatrix', projMatrix.elements);

		let t: Float32Array | undefined;
		let pointTotal = 0;
		let pointLastTotal = this.pointMesh.data.positions.length / 3;
		let pointPositions = this.pointMesh.data.positions;
		let pointRadius = this.pointMesh.data.sizes!;
		let pointColors = this.pointMesh.data.colors!;
		let lineTotal = 0;
		let lineLastTotal = this.lineMesh.data.positions.length / 6;
		let lineVertices = this.lineMesh.data.positions;
		let lineColors = this.lineMesh.data.colors!;

		for (const primitive of this.primitiveList) {
			if (primitive.type === 'points') {
				const newTotal = pointTotal + primitive.data.count;
				if (newTotal > pointLastTotal) {
					pointLastTotal += 100;
					pointPositions = resizeFloat32Array(pointPositions, pointLastTotal * 3);
					pointRadius = resizeFloat32Array(pointRadius, pointLastTotal * 1);
					pointColors = resizeFloat32Array(pointColors, pointLastTotal * 4);
				}
				pointPositions.set(primitive.data.positions, pointTotal * 3);
				pointRadius.set(primitive.data.radius, pointTotal * 1);
				pointColors.set(primitive.data.colors, pointTotal * 4);
				pointTotal += primitive.data.count;
			} else if (primitive.type === 'lines') {
				const newTotal = lineTotal + primitive.data.count;
				if (newTotal > lineLastTotal) {
					lineLastTotal += 100;
					lineVertices = resizeFloat32Array(lineVertices, lineLastTotal * 6);
					lineColors = resizeFloat32Array(lineColors, lineLastTotal * 8);
				}
				lineVertices.set(primitive.data.vertices, lineTotal * 6);
				lineColors.set(primitive.data.colors, lineTotal * 8);
				lineTotal += primitive.data.count;
			}
		}

		if (pointTotal) {
			this.pointMaterial.bind(gl);
			this.pointMesh.data.positions = pointPositions;
			this.pointMesh.data.sizes = pointRadius;
			this.pointMesh.data.colors = pointColors;
			this.pointMesh.data.count = pointTotal;
			this.pointMesh.updateBuffers();
			this.pointMesh.draw(gl);
		}
		if (lineTotal) {
			this.lineMaterial.bind(gl);
			this.lineMesh.data.positions = lineVertices;
			this.lineMesh.data.colors = lineColors;
			this.lineMesh.data.count = lineTotal;
			this.lineMesh.updateBuffers();
			this.lineMesh.draw(gl);
		}
	}

	public drawPrimitivePoints(positions: number[], radius: number, ttl: number = 0, color: Color = Color.White) {
		if (positions.length % 3 !== 0) {
			throw RangeError(
				`Debug.drawPrimitivePoints expected a multiple of 3 number for positions, got ${positions.length}.`
			);
		}
		this.primitiveList.push({
			type: 'points',
			ttl,
			data: {
				count: positions.length / 3,
				positions: new Float32Array(positions),
				radius: new Float32Array(new Array(positions.length / 3).fill(radius)),
				colors: new Float32Array(
					new Array(positions.length / 3).fill(1).reduce(
						(colors, _) => {
							colors.push(color.r, color.g, color.b, color.a);
							return colors;
						},
						[] as number[]
					)
				),
			},
		});
	}

	public drawPrimitiveLines(vertices: number[], ttl: number = 0, color: Color = Color.White) {
		if (vertices.length % 6 !== 0) {
			throw RangeError(`Debug.drawPrimitiveLines expected a multiple of 6 vertices, got ${vertices.length}.`);
		}
		this.primitiveList.push({
			type: 'lines',
			ttl,
			data: {
				count: vertices.length / 6,
				vertices: new Float32Array(vertices),
				colors: new Float32Array(
					new Array(vertices.length / 3).fill(1).reduce(
						(colors, _) => {
							colors.push(color.r, color.g, color.b, color.a);
							return colors;
						},
						[] as number[]
					)
				),
			},
		});
	}

	public drawPoint(
		position: Vector3 | ReadonlyVector3,
		radius: number,
		ttl: number = 0,
		color: Color = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		v0.copy(position).applyMatrix4(matrix);
		return this.drawPrimitivePoints([v0.x, v0.y, v0.z], radius, ttl, color);
	}

	public drawLine(
		start: Vector3 | ReadonlyVector3,
		end: Vector3 | ReadonlyVector3,
		ttl: number = 0,
		color: Color = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		v0.copy(start).applyMatrix4(matrix);
		v1.copy(end).applyMatrix4(matrix);
		return this.drawPrimitiveLines([v0.x, v0.y, v0.z, v1.x, v1.y, v1.z], ttl, color);
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
const v1 = new Vector3();
