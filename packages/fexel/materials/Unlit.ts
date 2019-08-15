import { Material, MaterialDepth, MaterialSide } from '../rendering/Material';
import { VertexShader, FragmentShader } from '../rendering/Shader';

export class UnlitMaterial extends Material {
	constructor() {
		super(
			new VertexShader(`
				attribute vec3 Position0;

				uniform mat4 ProjectionMatrix;
				uniform mat4 WorldMatrix;
				uniform mat4 ModelMatrix;

				void main(void) {
					gl_Position = ProjectionMatrix * WorldMatrix * ModelMatrix * vec4(Position0, 1.0);
				}
			`),
			new FragmentShader(`
				precision mediump float;

				void main(void) {
					gl_FragColor = vec4(1.0);
				}
			`),
			{
				depthFunc: MaterialDepth.LESS,
			}
		);
	}
}
