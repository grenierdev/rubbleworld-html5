import { Geometry } from './Geometry';
import { MeshData } from '../rendering/Mesh';
import { Vector3 } from '../math/Vector3';

export class SphereGeometry extends Geometry {
	public readonly meshData: MeshData;

	constructor(
		radius = 1,
		widthSegments = 8,
		heightSegments = widthSegments,
		phiStart = 0,
		phiLength = Math.PI * 2,
		thetaStart = 0,
		thetaLength = Math.PI
	) {
		super();

		this.meshData = makeSphere(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
	}
}

export function makeSphere(
	radius = 1,
	widthSegments = 8,
	heightSegments = 6,
	phiStart = 0,
	phiLength = Math.PI * 2,
	thetaStart = 0,
	thetaLength = Math.PI
): MeshData {
	const mesh = {
		vertices: new Float32Array((widthSegments + 1) * (heightSegments + 1) * 3),
		indices: new Uint16Array(widthSegments * heightSegments * 6),
		normals: new Float32Array((widthSegments + 1) * (heightSegments + 1) * 3),
		uvs: [new Float32Array((widthSegments + 1) * (heightSegments + 1) * 2)],
	};

	const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
	const grid: number[][] = [];

	for (let iy = 0, p = 0; iy <= heightSegments; ++iy) {
		const row: number[] = [];
		const v = iy / heightSegments;

		let uOffset = 0;
		if (iy == 0 && thetaStart == 0) {
			uOffset = 0.5 / widthSegments;
		} else if (iy == heightSegments && thetaEnd == Math.PI) {
			uOffset = -0.5 / widthSegments;
		}

		for (let ix = 0; ix <= widthSegments; ++ix, ++p) {
			const u = ix / widthSegments;

			v0.x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
			v0.y = radius * Math.cos(thetaStart + v * thetaLength);
			v0.z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

			mesh.vertices[p * 3 + 0] = v0.x;
			mesh.vertices[p * 3 + 1] = v0.y;
			mesh.vertices[p * 3 + 2] = v0.z;

			mesh.normals[p * 3 + 0] = v0.x;
			mesh.normals[p * 3 + 1] = v0.y;
			mesh.normals[p * 3 + 2] = v0.z;

			mesh.uvs[0][p * 2 + 0] = u + uOffset;
			mesh.uvs[0][p * 2 + 1] = 1 - v;

			row.push(p);
		}

		grid.push(row);
	}

	for (let iy = 0, p = 0; iy < heightSegments; ++iy) {
		for (let ix = 0; ix < widthSegments; ++ix) {
			const a = grid[iy][ix + 1];
			const b = grid[iy][ix];
			const c = grid[iy + 1][ix];
			const d = grid[iy + 1][ix + 1];

			if (iy !== 0 || thetaStart > 0) {
				mesh.indices[p * 3 + 0] = a;
				mesh.indices[p * 3 + 1] = b;
				mesh.indices[p * 3 + 2] = d;
				++p;
			}
			if (iy !== heightSegments - 1 || thetaEnd < Math.PI) {
				mesh.indices[p * 3 + 0] = b;
				mesh.indices[p * 3 + 1] = c;
				mesh.indices[p * 3 + 2] = d;
				++p;
			}
		}
	}

	return mesh;
}

const v0 = new Vector3();
