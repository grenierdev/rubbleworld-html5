import { Material } from '../rendering/Material';
import { VertexShader, FragmentShader } from '../rendering/Shader';

export class UnlitSampledMaterial extends Material {
	constructor() {
		super(
			new VertexShader(`
				attribute vec3 Position0;
				attribute vec2 vertUV1;

				uniform mat4 ProjectionMatrix;
				uniform mat4 ViewMatrix;
				uniform mat4 ModelMatrix;

				varying vec2 fragUV;

				void main(void) {
					fragUV = vertUV1;
					gl_Position = ProjectionMatrix * ViewMatrix * ModelMatrix * vec4(Position0, 1.0);
				}
			`),
			new FragmentShader(`
				precision mediump float;

				varying vec2 fragUV;
				uniform sampler2D Sampler;

				void main(void) {
					gl_FragColor = vec4(texture2D(sampler, fragUV).xyz, 0.25);
				}
			`)
		);
	}
}
