import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture } from '@fexel/core/rendering/Texture';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraPerspectivePrefab, CameraPerspectiveComponent, Clear } from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Vector2 } from '@fexel/core/math/Vector2';
import { Color } from '@fexel/core/math/Color';
import { Euler } from '@fexel/core/math/Euler';
import { DEG2RAD } from '@fexel/core/math/util';

const stats = new Stats(340);
stats.canvas.style.opacity = '0.9';
document.body.appendChild(stats.canvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
});

const material = new Material(
	new VertexShader(
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
	),
	new FragmentShader(
		`
		precision mediump float;

		varying vec2 fragUV;
		uniform sampler2D sampler;

		void main(void) {
			gl_FragColor = vec4(texture2D(sampler, fragUV).xyz, 0.25);
		}
	`
	)
);
material.twoSided = true;
material.transparent = false;
material.setUniform('sampler', tex);

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

const cam1 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		aspect: canvasEl.width / (canvasEl.height / 2),
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
const cam1Comp = cam1.getComponent(CameraPerspectiveComponent)!;
cam1Comp.backgroundColor = new Color(0.1, 0.1, 0.1);
cam1Comp.viewport.setFromCenterAndSize(new Vector2(0.5, 0.75), new Vector2(1, 0.5));
cam1Comp.showDebug = true;

const cam2 = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	rotation: new Euler(0, 0, 180 * DEG2RAD),
	camera: {
		fov: 40,
		aspect: canvasEl.width / (canvasEl.height / 2),
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});

const cam2Comp = cam2.getComponent(CameraPerspectiveComponent)!;
cam2Comp.viewport.setFromCenterAndSize(new Vector2(0.5, 0.25), new Vector2(1, 0.5));
cam2Comp.showDebug = true;
// cam2Comp.visibilityFlag = 0;

const obj = new Entity('UV', new TransformComponent(), new MoverComponent(), new MeshRendererComponent(mesh, material));

const scene = new Scene()
	.addChild(cam1)
	.addChild(cam2)
	.addChild(obj);

engine.loadScene(scene);
engine.start();

engine.debug.drawPrimitivePoints([0, 0, 0], 10, { ttl: 10.0, color: [1, 1, 1, 1] });
