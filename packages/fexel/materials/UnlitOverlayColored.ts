import { Material, MaterialSide, MaterialBlend, MaterialDepth } from '../rendering/Material';
import { FragmentShader, VertexShader } from '../rendering/Shader';

export class UnlitOverlayColoredMaterial extends Material {
	constructor() {
		super(
			new VertexShader(`
				attribute vec3 Position0;
				attribute vec4 Color0;

				varying vec4 fragColor;

				uniform mat4 ProjectionMatrix;
				uniform mat4 WorldMatrix;

				void main(void) {
					fragColor = Color0;
					gl_Position = ProjectionMatrix * WorldMatrix * vec4(Position0, 1.0);
				}
			`),
			new FragmentShader(`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
			`),
			{
				depthTest: false,
				depthFunc: MaterialDepth.ALWAYS,
				writeDepth: false,
				blend: true,
				blendFuncSource: MaterialBlend.SRC_ALPHA,
				blendFuncDestination: MaterialBlend.ONE_MINUS_SRC_ALPHA,
			}
		);
	}
}

export class UnlitOverlayColoredPointMaterial extends Material {
	constructor() {
		super(
			new VertexShader(
				`
				attribute vec3 Position0;
				attribute float Size;
				attribute vec4 Color0;

				varying vec4 fragColor;

				uniform mat4 ProjectionMatrix;
				uniform mat4 WorldMatrix;

				void main(void) {
					fragColor = Color0;
					gl_Position = ProjectionMatrix * WorldMatrix * vec4(Position0, 1.0);
					gl_PointSize = Size;
				}
			`
			),
			new FragmentShader(`
				precision mediump float;

				varying vec4 fragColor;

				void main(void) {
					gl_FragColor = fragColor;
				}
			`),
			{
				depthTest: false,
				depthFunc: MaterialDepth.ALWAYS,
				writeDepth: true,
				blend: true,
				blendFuncSource: MaterialBlend.SRC_ALPHA,
				blendFuncDestination: MaterialBlend.ONE_MINUS_SRC_ALPHA,
			}
		);
	}
}
