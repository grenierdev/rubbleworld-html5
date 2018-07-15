import { Vector3 } from "./math/Vector3";
import { Color } from "./math/Color";
import { Matrix4 } from "./math/Matrix4";

enum DebugType {
	Point,
	Line,
	Triangles
}

type DebugPrimitive = DebugPrimitivePoint | DebugPrimitiveLine | DebugPrimitiveTriangles;

interface DebugPrimitiveBase<T> {
	ttl: number
	type: T
	color: Color
}

interface DebugPrimitivePoint extends DebugPrimitiveBase<DebugType.Point> {
	point: number[]
	radius: number
}

interface DebugPrimitiveLine extends DebugPrimitiveBase<DebugType.Line> {
	points: number[]
}

interface DebugPrimitiveTriangles extends DebugPrimitiveBase<DebugType.Triangles> {
	points: number[]
	indices: number[]
}

export class Debug {
	private static stack: DebugPrimitive[] = [];

	public static log(...args: any[]) {
		console.log.apply(console, args);
	}

	public static draw(gl: WebGLRenderingContext) {
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
	}

	public static drawPrimitivePoint(position: number[], radius: number, color = Color.White, ttl = 0) {
		Debug.stack.push({
			ttl,
			radius,
			color,
			type: DebugType.Point,
			point: [position.x, position.y, position.z]
		} as DebugPrimitivePoint);
	}

	public static drawPrimitiveLine(positions: number[], color = Color.White, ttl = 0) {
		if (positions.length > 0) {
			Debug.stack.push({
				ttl,
				color,
				type: DebugType.Line,
				points: positions[0] instanceof Vector3
					? (positions as Vector3[]).reduce((points, pos) => { points.push(pos.x, pos.y, pos.z); return points; }, [] as number[])
					: positions
			} as DebugPrimitiveLine);
		}
	}

	public static drawPrimitiveTriangles(positions: number[], indices: number[], color = Color.White, ttl = 0) {
		if (positions.length > 0) {
			Debug.stack.push({
				ttl,
				color,
				indices,
				type: DebugType.Triangles,
				points: positions[0] instanceof Vector3
					? (positions as Vector3[]).reduce((points, pos) => { points.push(pos.x, pos.y, pos.z); return points; }, [] as number[])
					: positions
			} as DebugPrimitiveTriangles);
		}
	}


	public static drawPoint(position: Vector3, radius: number, color = Color.White, ttl = 0) {
		return Debug.drawPrimitivePoint([position.x, position.y, position.z], radius, color, ttl);
	}

	public static drawBox(min: Vector3, max: Vector3, color = Color.White, matrix = Matrix4.Identity, ttl = 0) {

	}

	public static drawCube(center: Vector3, size: number, color = Color.White, matrix = Matrix4.Identity, ttl = 0) {
		return Debug.drawBox(
			v0.copy(center).subScalar(size),
			v0.copy(center).addScalar(size),
			color,
			matrix,
			ttl
		);
	}

}

const v0 = new Vector3();