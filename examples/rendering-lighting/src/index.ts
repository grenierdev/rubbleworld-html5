import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture, TextureFormat, TextureType } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import {
	CameraPerspectivePrefab,
	CameraPerspectiveComponent,
	CameraComponent,
	CameraOrthographicPrefab,
} from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Color } from '@fexel/core/math/Color';
import { Euler } from '@fexel/core/math/Euler';
import { DEG2RAD } from '@fexel/core/math/util';
import { RenderTarget, RenderTargetAttachment } from '@fexel/core/rendering/RenderTarget';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { BoxGeometry } from '@fexel/core/geometries/Box';
import { SphereGeometry } from '@fexel/core/geometries/Sphere';
import { Vector2 } from '@fexel/core/math/Vector2';
import { LightComponent, DirectionalLightComponent } from '@fexel/core/components/Light';

const stats = new Stats();
stats.graphCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex1 = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
});

const uvMaterial = new UnlitSampledMaterial();
uvMaterial.uniforms.Texture0 = tex1;

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

const mainCam = CameraPerspectivePrefab({
	position: new Vector3(0, -10, 5),
	rotation: new Euler(70 * DEG2RAD, 0, 0),
	camera: {
		fov: 40,
		near: 0.01,
		far: 100,
		zoom: 0.5,
	},
});
mainCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.25, 0.5), new Vector2(0.5, 1.0));
mainCam.getComponent(CameraComponent)!.backgroundColor = Color.White;
mainCam.getComponent(CameraComponent)!.showDebug = true;
mainCam.getComponent(CameraComponent)!.visibilityFlag ^= 2;

const plane = new PlaneGeometry(10, 10);
const meshPlane = new Mesh(plane.meshData);
const objPlane = new Entity('Plane', [new TransformComponent(), new MeshRendererComponent(meshPlane, uvMaterial)]);

const box = new BoxGeometry(2, 2, 2);
const meshBox = new Mesh(box.meshData);
const objBox = new Entity('Box', [
	new TransformComponent(),
	new MeshRendererComponent(meshBox, uvMaterial),
	new MoverComponent(new Vector3(-1, 1, 2)),
]);

const sphere = new SphereGeometry(1);
const meshSphere = new Mesh(sphere.meshData);
const objSphere = new Entity('Sphere', [
	new TransformComponent(),
	new MeshRendererComponent(meshSphere, uvMaterial),
	new MoverComponent(new Vector3(1, 1, 2)),
]);

const shadowTex = new Texture({
	width: 512,
	height: 512,
	internalFormat: TextureFormat.DEPTH_COMPONENT,
	format: TextureFormat.DEPTH_COMPONENT,
	type: TextureType.UNSIGNED_INT,
});

const topLight = new Entity('Light', [
	new TransformComponent(new Vector3(0, 0, 10)),
	new DirectionalLightComponent(
		{
			intensity: 1.0,
			color: new Color().fromRGBA(231, 210, 179),
			shadowMap: shadowTex,
		},
		5,
		12
	),
]);
topLight.getComponent(LightComponent)!.visibilityFlag ^= 2;

const topCam = CameraOrthographicPrefab({
	name: 'Top',
	position: new Vector3(0, 0, 10),
	rotation: new Euler(0, 0, 0),
	camera: {
		left: -5,
		right: 5,
		top: 5,
		bottom: -5,
		near: 5,
		far: 12,
		zoom: 1,
	},
});
topCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.75, 0.75), new Vector2(0.5, 0.5));
topCam.getComponent(CameraComponent)!.visibilityFlag ^= 2;

const debugCam = CameraOrthographicPrefab({
	name: 'Debug',
	position: new Vector3(0, 0, 10),
	rotation: new Euler(0, 0, 0),
	camera: {
		left: -5,
		right: 5,
		top: -5,
		bottom: 5,
		near: 0.01,
		far: 100,
		zoom: 1,
	},
});
debugCam.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.75, 0.25), new Vector2(0.5, 0.5));
debugCam.getComponent(CameraComponent)!.visibilityFlag = 2;

const debugGeo = new PlaneGeometry(10, 10);
const debugMat = new UnlitSampledMaterial();
debugMat.uniforms.Texture0 = shadowTex;
const debugPlane = new Entity('RT', [
	new TransformComponent(new Vector3()),
	new MeshRendererComponent(new Mesh(debugGeo.meshData), debugMat),
]);
debugPlane.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const scene = new Scene().addChild(mainCam, objPlane, objBox, objSphere, topLight, topCam, debugCam, debugPlane);
engine.loadScene(scene);
engine.start();
