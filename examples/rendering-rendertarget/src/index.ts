import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture, TextureFormat, TextureType } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraPerspectivePrefab, CameraPerspectiveComponent, CameraComponent } from '@fexel/core/components/Camera';
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

const cam1 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, 10),
	camera: {
		fov: 40,
		near: 8,
		far: 11,
		zoom: 0.5,
	},
});
const cam1Comp = cam1.getComponent(CameraComponent)!;
cam1Comp.backgroundColor = Color.White;
cam1Comp.showDebug = true;
cam1Comp.renderTarget = rt;
cam1Comp.visibilityFlag = 2;

const plane = new PlaneGeometry(10, 10);
const meshPlane = new Mesh(plane.meshData);
const objPlane = new Entity('Plane', [new TransformComponent(), new MeshRendererComponent(meshPlane, uvMaterial)]);
objPlane.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const box = new BoxGeometry(2, 2, 2);
const meshBox = new Mesh(box.meshData);
const objBox = new Entity('Box', [
	new TransformComponent(),
	new MeshRendererComponent(meshBox, uvMaterial),
	new MoverComponent(new Vector3(-1, 1, 0)),
]);
objBox.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const sphere = new SphereGeometry(1);
const meshSphere = new Mesh(sphere.meshData);
const objSphere = new Entity('Sphere', [
	new TransformComponent(),
	new MeshRendererComponent(meshSphere, uvMaterial),
	new MoverComponent(new Vector3(1, 1, 0)),
]);
objSphere.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const cam2 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, 10),
	// rotation: new Euler(0, 0, 45 * DEG2RAD),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});

cam2.getComponent(CameraComponent)!.showDebug = true;
cam2.getComponent(CameraComponent)!.visibilityFlag = 1;

const screenGeo = new PlaneGeometry(1.8, 1.8);
const screenColorMat = new UnlitSampledMaterial();
screenColorMat.uniforms.Texture0 = screenColorTex;
const screenColor = new Entity('RT', [
	new TransformComponent(new Vector3(-0.9, 0, 0)),
	// new MoverComponent(),
	new MeshRendererComponent(new Mesh(screenGeo.meshData), screenColorMat),
]);
screenColor.getComponent(MeshRendererComponent)!.visibilityFlag = 1;

const screenDepthMat = new UnlitSampledMaterial();
screenDepthMat.uniforms.Texture0 = screenDepthTex;
// screenDepthMat.uniforms.Texture0 = screenColorTex;
const screenDepth = new Entity('RT', [
	new TransformComponent(new Vector3(0.9, 0, 0)),
	// new MoverComponent(),
	new MeshRendererComponent(new Mesh(screenGeo.meshData), screenDepthMat),
]);
screenDepth.getComponent(MeshRendererComponent)!.visibilityFlag = 1;

const scene = new Scene().addChild(cam1, cam2, objPlane, objBox, objSphere, screenColor, screenDepth);

engine.loadScene(scene);
engine.start();
