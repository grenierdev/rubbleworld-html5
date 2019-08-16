import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Texture } from '@fexel/core/rendering/Texture';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Scene, Entity } from '@fexel/core/Scene';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { TransformComponent } from '@fexel/core/components/Transform';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraOrthographicPrefab, CameraComponent, CameraPerspectivePrefab } from '@fexel/core/components/Camera';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Color } from '@fexel/core/math/Color';
import { Vector2 } from '@fexel/core/math/Vector2';
import { SphereGeometry } from '@fexel/core/geometries/Sphere';

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

const plane = new PlaneGeometry(0.75, 0.75);
const planeMesh = new Mesh(plane.meshData);
const planeEnt = new Entity('Plane', [
	new TransformComponent(new Vector3(0, -1, 0)),
	new MeshRendererComponent(planeMesh, uvDebugMat),
]);

const sphere = new SphereGeometry(0.75 / 2);
const sphereMesh = new Mesh(sphere.meshData);
const sphereEnt = new Entity('Sphere', [
	new TransformComponent(new Vector3(-1, 0, 0)),
	new MeshRendererComponent(sphereMesh, uvDebugMat),
]);

const orthoCam = CameraOrthographicPrefab({
	// position: new Vector3(0, 0, 0),
	camera: {
		left: -2,
		right: 2,
		top: 2,
		bottom: -2,
		near: -10,
		far: 10,
		zoom: 1,
	},
});
orthoCam.getComponent(CameraComponent)!.backgroundColor = new Color(0.1, 0.1, 0.1);
orthoCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.25, 0.5), new Vector2(0.5, 1.0));
orthoCam.getComponent(CameraComponent)!.showDebug = true;

const perspCam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -5),
	camera: {
		fov: 40,
		near: 0.01,
		far: 10,
		zoom: 1,
	},
});
perspCam.getComponent(CameraComponent)!.backgroundColor = new Color(0.12, 0.12, 0.12);
perspCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.75, 0.5), new Vector2(0.5, 1.0));
perspCam.getComponent(CameraComponent)!.showDebug = true;

const scene = new Scene().addChild(orthoCam, perspCam, planeEnt, sphereEnt);

engine.loadScene(scene);
engine.start();

engine.debug.drawPoint(new Vector3(1, 0, 0), 5, 3600, new Color(1, 0, 0));
engine.debug.drawPoint(new Vector3(0, 1, 0), 5, 3600, new Color(0, 1, 0));
engine.debug.drawPoint(new Vector3(0, 0, 1), 5, 3600, new Color(0, 0, 1));
engine.debug.drawPoint(new Vector3(0, 0, 0), 3, 3600, new Color(1, 1, 1));
