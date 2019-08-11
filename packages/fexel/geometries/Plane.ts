import { Geometry } from './Geometry';
import { MeshData } from '../rendering/Mesh';
import { Vector3 } from '../math/Vector3';

export class PlaneGeometry extends Geometry {
	public readonly meshData: MeshData;

	constructor(width = 1, height = 1, widthSegments = 1, heightSegments = widthSegments) {
		super();

		this.meshData = makePlane('x', 'y', 'z', 1, -1, width, height, 0, widthSegments, heightSegments);
	}
}

export function makePlane(
	u: 'x' | 'y' | 'z',
	v: 'x' | 'y' | 'z',
	w: 'x' | 'y' | 'z',
	uDir: 1 | -1,
	vDir: 1 | -1,
	width: number,
	height: number,
	depth: number,
	gridX: number,
	gridY: number
): MeshData {
	const halfW = width / 2;
	const halfH = height / 2;
	const halfD = depth / 2;
	const gridX1 = gridX + 1;
	const gridY1 = gridY + 1;
	const segmentW = width / gridX;
	const segmentH = height / gridY;

	const mesh = {
		vertices: new Float32Array(gridX1 * gridY1 * 3),
		indices: new Uint16Array(gridX * gridY * 6),
		normals: new Float32Array(gridX1 * gridY1 * 3),
		uvs: [new Float32Array(gridX1 * gridY1 * 2)],
	};

	for (let iy = 0, p = 0; iy < gridY1; ++iy) {
		const y = iy * segmentH - halfH;
		for (let ix = 0; ix < gridX1; ++ix, ++p) {
			const x = ix * segmentW - halfW;

			v0[u] = x * uDir;
			v0[v] = y * vDir;
			v0[w] = halfD;

			mesh.vertices[p * 3 + 0] = v0.x;
			mesh.vertices[p * 3 + 1] = v0.y;
			mesh.vertices[p * 3 + 2] = v0.z;

			v0[u] = 0;
			v0[v] = 0;
			v0[w] = depth >= 0 ? 1 : -1;

			mesh.normals[p * 3 + 0] = v0.x;
			mesh.normals[p * 3 + 1] = v0.y;
			mesh.normals[p * 3 + 2] = v0.z;

			mesh.uvs[0][p * 2 + 0] = ix / gridX;
			mesh.uvs[0][p * 2 + 1] = 1 - iy / gridY;
		}
	}

	for (let iy = 0, p = 0; iy < gridY1; ++iy) {
		for (let ix = 0; ix < gridX1; ++ix, ++p) {
			const a = ix + gridX1 * iy;
			const b = ix + gridX1 * (iy + 1);
			const c = ix + 1 + gridX1 * (iy + 1);
			const d = ix + 1 + gridX1 * iy;

			mesh.indices[p * 6 + 0] = a;
			mesh.indices[p * 6 + 1] = b;
			mesh.indices[p * 6 + 2] = d;

			mesh.indices[p * 6 + 3] = b;
			mesh.indices[p * 6 + 4] = c;
			mesh.indices[p * 6 + 5] = d;
		}
	}

	return mesh;
}

const v0 = new Vector3();
