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
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';

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

const mat = new UnlitSampledMaterial();
mat.setUniform('sampler', tex1);

const mesh = new Mesh({
	vertices: new Float32Array([20.0, 20.0, 0.0, -20.0, 20.0, 0.0, 20.0, -20.0, 0.0, -20.0, -20.0, 0.0]),
	indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
	uvs: [new Float32Array([1, 0, 0, 0, 1, 1, 0, 1])],
	colors: [new Float32Array([1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1])],
});

const objs = new Array(10).fill(1).map(
	(_, i) =>
		new Entity('Obj', [
			new TransformComponent(new Vector3(-100 + 20 * i, 30 * i, 0)),
			new Physics2BodyComponent(Physics2BodyType.Dynamic),
			new Physics2CircleColliderComponent(20),
			// new TransformComponent(
			// 	new Vector3(50 + (canvasEl.width - 100) * Math.random(), 50 + (canvasEl.height - 100) * Math.random(), 0)
			// ),
			// Math.random() > 0.5
			// 	? new Physics2CircleColliderComponent(5 + 10 * Math.random())
			// 	: new Physics2BoxColliderComponent(new Vector2(5 + 10 * Math.random(), 5 + 10 * Math.random())),
			// new MeshRendererComponent(mesh, mat),
		])
);

const ground = new Entity('Wall', [
	new TransformComponent(new Vector3(0, canvasEl.height / -2, 0)),
	new Physics2BodyComponent(Physics2BodyType.Static),
	new Physics2BoxColliderComponent(new Vector2(3000, 10)),
]);

const cam = CameraOrthographicPrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		left: canvasEl.width / -2,
		right: canvasEl.width / 2,
		top: canvasEl.height / 2,
		bottom: canvasEl.height / -2,
		near: 0.01,
		far: 2000,
		zoom: 0.5,
	},
});

const camComp = cam.getComponent(CameraComponent)!;
camComp.showDebug = true;

const scene = new Scene([new Physics2EngineComponent(new Vector2(0, -100), 6, 6)], [cam, ground, ...objs]);

engine.loadScene(scene);
engine.start();
