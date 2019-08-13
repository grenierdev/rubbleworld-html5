import { Color, ReadonlyColor } from '../math/Color';
import { Matrix4, ReadonlyMatrix4 } from '../math/Matrix4';
import { Vector3, ReadonlyVector3 } from '../math/Vector3';
import { Material, MaterialSide, MaterialDepth, MaterialBlend } from './Material';
import { VertexShader, FragmentShader } from './Shader';
import { PointMesh, LineMesh } from './Mesh';
import { Line3, ReadonlyLine3 } from '../math/Line3';
import { Vector2, ReadonlyVector2 } from '../math/Vector2';
import { DEG2RAD } from '../math/util';
import { Quaternion } from '../math/Quaternion';
import { Euler } from '../math/Euler';
import { Box3, ReadonlyBox3 } from '../math/Box3';
import { Box2, ReadonlyBox2 } from '../math/Box2';
import { UnlitOverlayColoredPointMaterial, UnlitOverlayColoredMaterial } from '../materials/UnlitOverlayColored';

type DebugPrimitive =
	| DebugPrimitiveBase<'points', { count: number; positions: Float32Array; radius: Float32Array; colors: Float32Array }>
	| DebugPrimitiveBase<'lines', { count: number; vertices: Float32Array; colors: Float32Array }>;
// | DebugPrimitiveBase<'triangles', { vertices: Float32Array, colors: Float32Array }>

type DebugPrimitiveBase<T, D = {}> = { type: T; ttl: number; data: D };

export class Debug {
	protected primitiveList: DebugPrimitive[] = [];
	protected pointMaterial: Material = new UnlitOverlayColoredPointMaterial();
	protected pointMesh: PointMesh = new PointMesh(
		{
			count: 0,
			positions: new Float32Array(),
			sizes: new Float32Array(),
			colors: new Float32Array(),
		},
		true
	);
	protected lineMaterial: Material = new UnlitOverlayColoredMaterial();
	protected lineMesh: LineMesh = new LineMesh(
		{
			count: 0,
			positions: new Float32Array(),
			colors: new Float32Array(),
		},
		true
	);

	public growRate: number = 100;

	public update(delta: number) {
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
	}

	public draw(ViewMatrix: Matrix4 | ReadonlyMatrix4, projMatrix: Matrix4 | ReadonlyMatrix4, gl: WebGLRenderingContext) {
		this.pointMaterial.setUniform('ViewMatrix', ViewMatrix.elements);
		this.pointMaterial.setUniform('ProjectionMatrix', projMatrix.elements);
		this.lineMaterial.setUniform('ViewMatrix', ViewMatrix.elements);
		this.lineMaterial.setUniform('ProjectionMatrix', projMatrix.elements);

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
					pointLastTotal += this.growRate;
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
					lineLastTotal += this.growRate;
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

	public drawPrimitivePoints(
		positions: number[],
		radius: number,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White
	) {
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

	public drawPrimitiveLines(vertices: number[], ttl: number = 0, color: Color | ReadonlyColor = Color.White) {
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
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		return this.drawPoints([position], radius, ttl, color, matrix);
	}

	public drawPoints(
		positions: (Vector3 | ReadonlyVector3)[],
		radius: number,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		for (const position of positions) {
			v0.copy(position).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
		}
		return this.drawPrimitivePoints(vertices, radius, ttl, color);
	}

	public drawLine(
		line: Line3 | ReadonlyLine3,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		return this.drawLines([line], ttl, color, matrix);
	}

	public drawLines(
		lines: (Line3 | ReadonlyLine3)[],
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		for (const line of lines) {
			v0.copy(line.start).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
			v0.copy(line.end).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
		}
		return this.drawPrimitiveLines(vertices, ttl, color);
	}

	public drawConnectedLines(
		positions: (Vector3 | ReadonlyVector3)[],
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		for (let i = 1, l = positions.length; i < l; ++i) {
			v0.copy(positions[i - 1]).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
			v0.copy(positions[i]).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
		}
		return this.drawPrimitiveLines(vertices, ttl, color);
	}

	public drawLineLoop(
		positions: (Vector3 | ReadonlyVector3)[],
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		return this.drawConnectedLines(positions.concat([positions[0]]), ttl, color, matrix);
	}

	public drawCircle(
		center: Vector2 | ReadonlyVector2,
		radius: number,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		return this.drawNGon(center, radius, 12, ttl, color, matrix);
	}

	public drawNGon(
		center: Vector2 | ReadonlyVector2,
		radius: number,
		sides: number,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		for (let i = 1; i <= sides; ++i) {
			let t = ((i - 1) * 2 * Math.PI) / sides;
			v0.set(center.x + radius * Math.cos(t), center.y + radius * Math.sin(t), 0).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
			t = (i * 2 * Math.PI) / sides;
			v0.set(center.x + radius * Math.cos(t), center.y + radius * Math.sin(t), 0).applyMatrix4(matrix);
			vertices.push(v0.x, v0.y, v0.z);
		}
		return this.drawPrimitiveLines(vertices, ttl, color);
	}

	public drawSphere(
		center: Vector3 | ReadonlyVector3,
		radius: number,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		m0.compose(
			center,
			Quaternion.Identity,
			Vector3.One
		).multiply(matrix);
		this.drawCircle(Vector2.Zero, radius, ttl, color, m0);
		m0.multiply(mrx);
		this.drawCircle(Vector2.Zero, radius, ttl, color, m0);
		m0.multiply(mry);
		this.drawCircle(Vector2.Zero, radius, ttl, color, m0);
	}

	public drawBox2(
		box: Box2 | ReadonlyBox2,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		const min = box.min;
		const max = box.max;

		v0.set(min.x, min.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, min.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, 0).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);

		return this.drawPrimitiveLines(vertices, ttl, color);
	}

	public drawBox3(
		box: Box3 | ReadonlyBox3,
		ttl: number = 0,
		color: Color | ReadonlyColor = Color.White,
		matrix: Matrix4 | ReadonlyMatrix4 = Matrix4.Identity
	) {
		const vertices: number[] = [];
		const min = box.min;
		const max = box.max;
		// FRONT
		v0.set(min.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		// BACK
		v0.set(min.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		// BOTTOM
		v0.set(min.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, min.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		// TOP
		v0.set(min.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(min.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, min.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);
		v0.set(max.x, max.y, max.z).applyMatrix4(matrix);
		vertices.push(v0.x, v0.y, v0.z);

		return this.drawPrimitiveLines(vertices, ttl, color);
	}
}

const m0 = new Matrix4();
const mrx = new Matrix4().compose(
	Vector3.Zero,
	new Quaternion().setFromEuler(new Euler(90 * DEG2RAD, 0, 0)),
	Vector3.One
);
const mry = new Matrix4().compose(
	Vector3.Zero,
	new Quaternion().setFromEuler(new Euler(0, 90 * DEG2RAD, 0)),
	Vector3.One
);

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
