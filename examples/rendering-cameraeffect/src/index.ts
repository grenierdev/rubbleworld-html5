import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Vector3 } from '@fexel/core/math/Vector3';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { Texture } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import {
	CameraPerspectivePrefab,
	CameraPerspectiveComponent,
	CameraComponent,
	CameraEffect,
} from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Color } from '@fexel/core/math/Color';
import { RenderTarget, RenderTargetAttachment } from '@fexel/core/rendering/RenderTarget';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';

const stats = new Stats();
stats.graphCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
});

const mat = new UnlitSampledMaterial();
mat.uniforms.Texture0 = tex;

const mesh = new Mesh(new PlaneGeometry().meshData);

class MoverComponent extends Component {
	public transform: TransformComponent | undefined;
	didMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update({ time }) {
		if (this.transform) {
			this.transform.localPosition.set(
				Math.sin(Math.max(0, time) / 500),
				Math.cos(Math.max(0, time) / 500),
				Math.cos(Math.max(0, time) / 100)
			);
		}
	}
}

const obj = new Entity('UV', [new TransformComponent(), new MoverComponent(), new MeshRendererComponent(mesh, mat)]);

const sepiaEffect = new CameraEffect(
	new Material(
		new VertexShader(`
			attribute vec3 Position0;
			attribute vec2 UV0;
			varying vec2 fragUV;

			void main(void) {
				fragUV = UV0;
				gl_Position = vec4(Position0, 1.0);
			}
		`),
		new FragmentShader(`
			precision mediump float;

			uniform sampler2D Texture0;
			varying vec2 fragUV;

			const float opacity = 0.75;

			void main(void) {
				vec4 texColor = texture2D(Texture0, fragUV);
				float grey = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

				vec3 sepia = vec3(grey);

				// sepia *= vec3(1.2, 1.0, 0.8);
				sepia *= vec3(1.0, 0.95, 0.82);

				texColor.rgb = mix(
					texColor.rgb,
					sepia,
					opacity
				);

				gl_FragColor = texColor;
			}
		`)
	),
	new RenderTarget(512, 512, new Map([[RenderTargetAttachment.COLOR0, new Texture({ width: 512, height: 512 })]]))
);
const vignetteEffect = new CameraEffect(
	new Material(
		new VertexShader(`
			attribute vec3 Position0;
			attribute vec2 UV0;
			varying vec2 fragUV;

			void main(void) {
				fragUV = UV0;
				gl_Position = vec4(Position0, 1.0);
			}
		`),
		new FragmentShader(`
			precision mediump float;

			uniform sampler2D Texture0;
			varying vec2 fragUV;

			const float radius = 0.75;
			const float softness = 0.45;
			const float opacity = 0.5;

			void main(void) {
				vec4 texColor = texture2D(Texture0, fragUV);
				vec2 position = fragUV.xy - vec2(0.5);
				
				float vignette = smoothstep(
					radius,
					radius - softness,
					length(position)
				);

				texColor.rgb = mix(
					texColor.rgb,
					texColor.rgb * vignette,
					opacity
				);

				gl_FragColor = texColor;
			}
		`)
	),
	new RenderTarget(512, 512, new Map([[RenderTargetAttachment.COLOR0, new Texture({ width: 512, height: 512 })]]))
);

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, 10),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
const cam1Comp = cam.getComponent(CameraComponent)!;
cam1Comp.backgroundColor = Color.White;
cam1Comp.showDebug = true;
cam1Comp.effects.push(sepiaEffect);
cam1Comp.effects.push(vignetteEffect);

const scene = new Scene().addChild(cam).addChild(obj);

engine.loadScene(scene);
engine.start();

engine.debug.drawPrimitivePoints([0, 0, 0], 10, 10.0);
