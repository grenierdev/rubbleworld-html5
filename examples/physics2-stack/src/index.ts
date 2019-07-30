import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { CameraOrthographicPrefab, CameraComponent } from '@fexel/core/components/Camera';
import { Scene, Entity } from '@fexel/core/Scene';
import { Vector3 } from '@fexel/core/math/Vector3';
import { TransformComponent } from '@fexel/core/components/Transform';
import {
	Physics2BodyComponent,
	Physics2BoxColliderComponent,
	Physics2EngineComponent,
	Physics2CircleColliderComponent,
	Physics2BodyType,
} from '@fexel/core/components/Physics2';
import { Box2 } from '@fexel/core/math/Box2';
import { Vector2 } from '@fexel/core/math/Vector2';
import { Circle } from '@fexel/core/math/Circle';
import { Texture } from '@fexel/core/rendering/Texture';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Material } from '@fexel/core/rendering/Material';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';

const stats = new Stats(340);
stats.canvas.style.opacity = '0.9';
document.body.appendChild(stats.canvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex1 = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
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

const mat = new Material(vertShader, fragShader);
mat.twoSided = true;
mat.transparent = false;
mat.setUniform('sampler', tex1);

const mesh = new Mesh({
	vertices: new Float32Array([10.0, 10.0, 0.0, -10.0, 10.0, 0.0, 10.0, -10.0, 0.0, -10.0, -10.0, 0.0]),
	indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
	uvs: [new Float32Array([1, 0, 0, 0, 1, 1, 0, 1])],
	colors: [new Float32Array([1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1])],
});

const objs = new Array(400).fill(1).map(
	() =>
		new Entity('Obj', [
			new TransformComponent(
				new Vector3(50 + (canvasEl.width - 100) * Math.random(), 50 + (canvasEl.height - 100) * Math.random(), 0)
			),
			new Physics2BodyComponent(Physics2BodyType.Dynamic),
			// new Physics2CircleColliderComponent(10),
			new Physics2BoxColliderComponent(new Vector2(10, 10)),
			// new Physics2BoxColliderComponent(new Vector2(10 + 15 * Math.random(), 10 + 15 * Math.random())),
			// new Physics2CircleColliderComponent(new Circle(new Vector2(), 10 + 15 * Math.random())),
			// new MeshRendererComponent(mesh, mat),
		])
);

const walls = [
	[canvasEl.width / 2, 0, canvasEl.width, 50],
	[canvasEl.width / 2, canvasEl.height, canvasEl.width, 50],
	[canvasEl.width, canvasEl.height / 2, 50, canvasEl.height],
	[0, canvasEl.height / 2, 50, canvasEl.height],
].map(
	size =>
		new Entity('Wall', [
			new TransformComponent(new Vector3(size[0], size[1], 0)),
			new Physics2BodyComponent(Physics2BodyType.Static),
			new Physics2BoxColliderComponent(new Vector2(size[2], size[3])),
		])
);

const cam = CameraOrthographicPrefab({
	position: new Vector3(canvasEl.width / -2, canvasEl.height / -2, -10),
	camera: {
		left: canvasEl.width / -2,
		right: canvasEl.width / 2,
		top: canvasEl.height / 2,
		bottom: canvasEl.height / -2,
		near: 0.01,
		far: 2000,
		zoom: 0.9,
	},
});

const camComp = cam.getComponent(CameraComponent)!;
// cam2Comp.viewport.setFromCenterAndSize(new Vector2(0.5, 0.25), new Vector2(1, 0.5));
camComp.showDebug = true;

const scene = new Scene([new Physics2EngineComponent(new Vector2(0, -100), 8, 1)], [cam, ...walls, ...objs]);

engine.loadScene(scene);
engine.start();
