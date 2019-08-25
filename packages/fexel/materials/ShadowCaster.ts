import { Material, MaterialDepth, MaterialSide } from '../rendering/Material';
import { VertexShader, FragmentShader } from '../rendering/Shader';

export class ShadowCasterMaterial extends Material {
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

				vec4 encodeFloat (in float depth) {
					const vec4 bitShift = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
					const vec4 bitMask = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
					vec4 comp = fract(depth * bitShift);
					comp -= comp.xxyz * bitMask;
					return comp;
				}

				void main(void) {
					gl_FragColor = encodeFloat(gl_FragCoord.z);
				}
			`),
			{
				side: MaterialSide.BACK,
			}
		);
	}
}
