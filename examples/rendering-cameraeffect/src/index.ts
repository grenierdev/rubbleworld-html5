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
	CameraOrthographicPrefab,
} from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Color } from '@fexel/core/math/Color';
import { RenderTarget, RenderTargetAttachment } from '@fexel/core/rendering/RenderTarget';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';
import { Vector2 } from '@fexel/core/math/Vector2';

const stats = new Stats();
stats.graphCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const uvDebugTex = new Texture({ data: document.getElementById('uvdebug')! as HTMLImageElement });
const uvDebugMat = new UnlitSampledMaterial();
uvDebugMat.uniforms.Texture0 = uvDebugTex;

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

const plane = new PlaneGeometry();
const planeMesh = new Mesh(plane.meshData);
const planeEnt = new Entity('Plane', [
	new TransformComponent(),
	new MoverComponent(),
	new MeshRendererComponent(planeMesh, uvDebugMat),
]);

const sepiaEffect = new CameraEffect(
	new Material(
		new VertexShader(`
			attribute vec3 Position0;
			attribute vec2 UV0;
			varying vec2 v_UV;

			void main(void) {
				v_UV = UV0;
				gl_Position = vec4(Position0, 1.0);
			}
		`),
		new FragmentShader(`
			precision mediump float;

			uniform sampler2D Texture0;
			varying vec2 v_UV;

			const float opacity = 0.75;

			void main(void) {
				vec4 texColor = texture2D(Texture0, v_UV);
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
			varying vec2 v_UV;

			void main(void) {
				v_UV = UV0;
				gl_Position = vec4(Position0, 1.0);
			}
		`),
		new FragmentShader(`
			precision mediump float;

			uniform sampler2D Texture0;
			varying vec2 v_UV;

			const float radius = 0.75;
			const float softness = 0.45;
			const float opacity = 0.5;

			void main(void) {
				vec4 texColor = texture2D(Texture0, v_UV);
				vec2 position = v_UV.xy - vec2(0.5);
				
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

const virginCam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
virginCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.125, 0.5), new Vector2(0.25, 1.0));
virginCam.getComponent(CameraComponent)!.backgroundColor = Color.White;
virginCam.getComponent(CameraComponent)!.showDebug = true;
virginCam.getComponent(CameraComponent)!.visibilityFlag ^= 2;
virginCam.getComponent(CameraComponent)!.visibilityFlag ^= 4;

const vignetteCam = CameraOrthographicPrefab({
	camera: {
		left: -0.5,
		right: 0.5,
		top: 0.5,
		bottom: -0.5,
		near: -10,
		far: 10,
		zoom: 1,
	},
});
vignetteCam
	.getComponent(CameraComponent)!
	.viewport.setFromCenterAndSize(new Vector2(0.375, 0.5), new Vector2(0.25, 1.0));
vignetteCam.getComponent(CameraComponent)!.visibilityFlag = 4;
const vignetteMat = new UnlitSampledMaterial();
vignetteMat.uniforms.Texture0 = vignetteEffect.buffer.attachments.get(RenderTargetAttachment.COLOR0)!;
const vignetteEnt = new Entity('Vignette', [
	new TransformComponent(),
	new MeshRendererComponent(planeMesh, vignetteMat),
]);
vignetteEnt.getComponent(MeshRendererComponent)!.visibilityFlag = 4;

const sepiaCam = CameraOrthographicPrefab({
	camera: {
		left: -0.5,
		right: 0.5,
		top: 0.5,
		bottom: -0.5,
		near: -10,
		far: 10,
		zoom: 1,
	},
});
sepiaCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.625, 0.5), new Vector2(0.25, 1.0));
sepiaCam.getComponent(CameraComponent)!.visibilityFlag = 2;
const sepiaMat = new UnlitSampledMaterial();
sepiaMat.uniforms.Texture0 = sepiaEffect.buffer.attachments.get(RenderTargetAttachment.COLOR0)!;
const sepiaEnt = new Entity('Sepia', [new TransformComponent(), new MeshRendererComponent(planeMesh, sepiaMat)]);
sepiaEnt.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const mainCam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
mainCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.875, 0.5), new Vector2(0.25, 1.0));
mainCam.getComponent(CameraComponent)!.backgroundColor = Color.White;
mainCam.getComponent(CameraComponent)!.showDebug = true;
mainCam.getComponent(CameraComponent)!.visibilityFlag ^= 2;
mainCam.getComponent(CameraComponent)!.visibilityFlag ^= 4;
mainCam.getComponent(CameraComponent)!.effects.push(vignetteEffect);
mainCam.getComponent(CameraComponent)!.effects.push(sepiaEffect);

const scene = new Scene()
	.addChild(mainCam, planeEnt, virginCam)
	.addChild(sepiaCam, sepiaEnt)
	.addChild(vignetteCam, vignetteEnt);

engine.loadScene(scene);
engine.start();

engine.debug.drawPoint(new Vector3(1, 0, 0), 5, 3600, new Color(1, 0, 0));
engine.debug.drawPoint(new Vector3(0, 1, 0), 5, 3600, new Color(0, 1, 0));
engine.debug.drawPoint(new Vector3(0, 0, 1), 5, 3600, new Color(0, 0, 1));
engine.debug.drawPoint(new Vector3(0, 0, 0), 3, 3600, new Color(1, 1, 1));
