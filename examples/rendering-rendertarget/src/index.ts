import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraPerspectivePrefab, CameraPerspectiveComponent, CameraComponent } from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Color } from '@fexel/core/math/Color';
import { Euler } from '@fexel/core/math/Euler';
import { DEG2RAD } from '@fexel/core/math/util';
import { RenderTarget } from '@fexel/core/rendering/RenderTarget';

const stats = new Stats();
stats.graphCanvas.style.opacity = '0.9';
stats.labelCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex1 = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
});

const tex2 = new Texture({
	width: 512,
	height: 512,
});

const vertShader = new VertexShader(
	`
		attribute vec3 vertPosition;
		attribute vec2 vertUV1;

		uniform mat4 projectionMatrix;
		uniform mat4 viewMatrix;
		uniform mat4 worldMatrix;

		varying vec2 fragUV;

		void main(void) {
			fragUV = vertUV1;
			gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertPosition, 1.0);
		}
	`
);
const fragShader = new FragmentShader(
	`
		precision mediump float;

		varying vec2 fragUV;
		uniform sampler2D sampler;

		void main(void) {
			gl_FragColor = vec4(texture2D(sampler, fragUV).xyz, 0.25);
		}
	`
);

const uvMaterial = new Material(vertShader, fragShader);
uvMaterial.twoSided = true;
uvMaterial.transparent = false;
uvMaterial.setUniform('sampler', tex1);

const rtMaterial = new Material(vertShader, fragShader);
rtMaterial.twoSided = true;
rtMaterial.transparent = false;
rtMaterial.setUniform('sampler', tex2);

const mesh = new Mesh({
	vertices: new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]),
	indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
	uvs: [new Float32Array([1, 0, 0, 0, 1, 1, 0, 1])],
	colors: [new Float32Array([1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1])],
});

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

const rt = new RenderTarget(tex2.width!, tex2.height!, tex2, true);

const cam1 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		aspect: canvasEl.width / canvasEl.height,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
const cam1Comp = cam1.getComponent(CameraComponent)!;
cam1Comp.backgroundColor = Color.White;
cam1Comp.showDebug = true;
cam1Comp.renderTarget = rt;
cam1Comp.visibilityFlag = 2;

const obj1 = new Entity('UV', [
	new TransformComponent(),
	new MoverComponent(),
	new MeshRendererComponent(mesh, uvMaterial),
]);
const obj1Comp = obj1.getComponent(MeshRendererComponent)!;
obj1Comp.visibilityFlag = 2;

const cam2 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	rotation: new Euler(0, 0, 45 * DEG2RAD),
	camera: {
		fov: 40,
		aspect: canvasEl.width / canvasEl.height,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});

const cam2Comp = cam2.getComponent(CameraComponent)!;
// cam2Comp.viewport.setFromCenterAndSize(new Vector2(0.5, 0.25), new Vector2(1, 0.5));
cam2Comp.showDebug = true;
cam2Comp.visibilityFlag = 1;

const obj2 = new Entity('RT', [
	new TransformComponent(),
	// new MoverComponent(),
	new MeshRendererComponent(mesh, rtMaterial),
]);
const obj2Comp = obj2.getComponent(MeshRendererComponent)!;
obj2Comp.visibilityFlag = 1;

const scene = new Scene()
	.addChild(cam1)
	.addChild(cam2)
	.addChild(obj1)
	.addChild(obj2);

engine.loadScene(scene);
engine.start();

engine.debug.drawPrimitivePoints([0, 0, 0], 10, { ttl: 10.0, color: [1, 1, 1, 1] });
