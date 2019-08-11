import { Geometry } from './Geometry';
import { MeshData } from '../rendering/Mesh';
import { makePlane } from './Plane';

export class BoxGeometry extends Geometry {
	public readonly meshData: MeshData;

	constructor(
		width = 1,
		height = 1,
		depth = 1,
		widthSegments = 1,
		heightSegments = widthSegments,
		depthSegments = widthSegments
	) {
		super();

		const planes = [
			makePlane('z', 'y', 'x', -1, -1, depth, height, width, depthSegments, heightSegments),
			makePlane('z', 'y', 'x', 1, -1, depth, height, -width, depthSegments, heightSegments),
			makePlane('x', 'z', 'y', 1, 1, width, depth, height, widthSegments, depthSegments),
			makePlane('x', 'z', 'y', 1, -1, width, depth, -height, widthSegments, depthSegments),
			makePlane('x', 'y', 'z', 1, -1, width, height, depth, widthSegments, heightSegments),
			makePlane('x', 'y', 'z', -1, -1, width, height, -depth, widthSegments, heightSegments),
		];

		this.meshData = {
			vertices: new Float32Array(planes.reduce((c, p) => c + p.vertices.length, 0)),
			indices: new Uint16Array(planes.reduce((c, p) => c + p.indices.length, 0)),
			normals: new Float32Array(planes.reduce((c, p) => c + p.normals!.length, 0)),
			uvs: [new Float32Array(planes.reduce((c, p) => c + p.uvs![0].length, 0))],
		};

		let vi = 0;
		let ii = 0;
		let ni = 0;
		let ui = 0;
		for (const plane of planes) {
			this.meshData.vertices.set(plane.vertices, vi);
			this.meshData.indices.set(plane.indices.map(i => i + vi / 3), ii);
			this.meshData.normals!.set(plane.normals!, ni);
			this.meshData.uvs![0].set(plane.uvs![0], ui);
			vi += plane.vertices.length;
			ii += plane.indices.length;
			ni += plane.normals!.length;
			ui += plane.uvs![0].length;
		}
	}
}
