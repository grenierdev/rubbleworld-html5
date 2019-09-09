import { Engine, EngineStats } from '@fexel/core/Engine';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture, TextureFormat, TextureType } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraPerspectivePrefab, CameraComponent, CameraOrthographicPrefab } from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { Color } from '@fexel/core/math/Color';
import { DEG2RAD } from '@fexel/core/math/util';
import { RenderTarget, RenderTargetAttachment } from '@fexel/core/rendering/RenderTarget';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { BoxGeometry } from '@fexel/core/geometries/Box';
import { SphereGeometry } from '@fexel/core/geometries/Sphere';
import { Vector2 } from '@fexel/core/math/Vector2';
import { RendererComponent } from '@fexel/core/components/Renderer';

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new Engine());
const renderer = new RendererComponent(canvasEl);

const stats = new EngineStats(engine, renderer);
stats.graphCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const uvDebugTex = new Texture({ data: document.getElementById('uvdebug')! as HTMLImageElement });
const uvDebugMat = new UnlitSampledMaterial();
uvDebugMat.uniforms.Texture0 = uvDebugTex;

class MoverComponent extends Component {
	public transform: TransformComponent | undefined;
	constructor(public offset = new Vector3()) {
		super();
	}
	didMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update({ time }) {
		if (this.transform) {
			this.transform.localPosition.set(
				this.offset.x + Math.sin(Math.max(0, time) / 500),
				this.offset.y + Math.cos(Math.max(0, time) / 500),
				this.offset.z
			);
			this.transform.localRotation.set(
				this.transform.localRotation.x + 1 * DEG2RAD,
				this.transform.localRotation.y + 1 * DEG2RAD,
				this.transform.localRotation.z + 1 * DEG2RAD
			);
		}
	}
}
const screenColorTex = new Texture({ width: 512, height: 512 });
const screenDepthTex = new Texture({
	width: 512,
	height: 512,
	internalFormat: TextureFormat.DEPTH_COMPONENT,
	format: TextureFormat.DEPTH_COMPONENT,
	type: TextureType.UNSIGNED_INT,
});

const rt = new RenderTarget(
	512,
	512,
	new Map([[RenderTargetAttachment.COLOR0, screenColorTex], [RenderTargetAttachment.DEPTH, screenDepthTex]])
);

const recorderCam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		near: 8,
		far: 11,
		zoom: 0.5,
	},
});
recorderCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.5, 0.5), new Vector2(0.5, 0.5));
recorderCam.getComponent(CameraComponent)!.backgroundColor = Color.White;
recorderCam.getComponent(CameraComponent)!.showDebug = true;
recorderCam.getComponent(CameraComponent)!.renderTarget = rt;
recorderCam.getComponent(CameraComponent)!.visibilityFlag = 2;

const plane = new PlaneGeometry(10, 10);
const planeMesh = new Mesh(plane.meshData);
const planeEnt = new Entity('Plane', [new TransformComponent(), new MeshRendererComponent(planeMesh, uvDebugMat)]);
planeEnt.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const box = new BoxGeometry(2, 2, 2);
const boxMesh = new Mesh(box.meshData);
const boxEnt = new Entity('Box', [
	new TransformComponent(),
	new MeshRendererComponent(boxMesh, uvDebugMat),
	new MoverComponent(new Vector3(-1, 1, 0)),
]);
boxEnt.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const sphere = new SphereGeometry(1);
const sphereMesh = new Mesh(sphere.meshData);
const sphereEnt = new Entity('Sphere', [
	new TransformComponent(),
	new MeshRendererComponent(sphereMesh, uvDebugMat),
	new MoverComponent(new Vector3(1, 1, 0)),
]);
sphereEnt.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

// const mainCam = CameraPerspectivePrefab({
// 	position: new Vector3(0, 0, -10),
// 	camera: {
// 		fov: 40,
// 		near: 0.1,
// 		far: 100.0,
// 		zoom: 2,
// 	},
// });
const mainCam = CameraOrthographicPrefab({
	camera: {
		left: -1,
		right: 1,
		top: 1,
		bottom: -1,
		near: -10,
		far: 10,
		zoom: 1,
	},
});

mainCam.getComponent(CameraComponent)!.showDebug = true;
mainCam.getComponent(CameraComponent)!.visibilityFlag = 1;

const screenGeo = new PlaneGeometry();
const screenColorMat = new UnlitSampledMaterial();
screenColorMat.uniforms.Texture0 = screenColorTex;
const screenColor = new Entity('ScreenColor', [
	new TransformComponent(new Vector3(-0.5, 0, 0)),
	new MeshRendererComponent(new Mesh(screenGeo.meshData), screenColorMat),
]);
screenColor.getComponent(MeshRendererComponent)!.visibilityFlag = 1;

const screenDepthMat = new UnlitSampledMaterial();
screenDepthMat.uniforms.Texture0 = screenDepthTex;
const screenDepth = new Entity('ScreenDepth', [
	new TransformComponent(new Vector3(0.5, 0, 0)),
	new MeshRendererComponent(new Mesh(screenGeo.meshData), screenDepthMat),
]);
screenDepth.getComponent(MeshRendererComponent)!.visibilityFlag = 1;

const scene = new Scene([renderer]).addChild(
	recorderCam,
	mainCam,
	planeEnt,
	boxEnt,
	sphereEnt,
	screenColor,
	screenDepth
);

engine.loadScene(scene);
engine.start();
