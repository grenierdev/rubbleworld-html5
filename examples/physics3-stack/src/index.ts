import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { CameraOrthographicPrefab, CameraComponent, CameraPerspectivePrefab } from '@fexel/core/components/Camera';
import { Scene, Entity } from '@fexel/core/Scene';
import { Vector3 } from '@fexel/core/math/Vector3';
import { TransformComponent } from '@fexel/core/components/Transform';
import {
	Physics3BodyComponent,
	Physics3BoxColliderComponent,
	Physics3EngineComponent,
	Physics3SphereColliderComponent,
	Physics3BodyType,
	Physics3PlaneColliderComponent,
} from '@fexel/core/components/Physics3';
import { Box2 } from '@fexel/core/math/Box2';
import { Vector2 } from '@fexel/core/math/Vector2';
import { Circle } from '@fexel/core/math/Circle';
import { Texture } from '@fexel/core/rendering/Texture';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Material } from '@fexel/core/rendering/Material';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { Color } from '@fexel/core/math/Color';
import { Matrix4 } from '@fexel/core/math/Matrix4';
import { DEG2RAD } from '@fexel/core/math/util';
import { Quaternion } from '@fexel/core/math/Quaternion';
import { Euler } from '@fexel/core/math/Euler';
import { Line3 } from '@fexel/core/math/Line3';
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
			new TransformComponent(new Vector3(-100 + 20 * i, 30 * i, -20 * i)),
			new Physics3BodyComponent(Physics3BodyType.Dynamic),
			new Physics3SphereColliderComponent(20),
			// new Physics3BoxColliderComponent(new Vector3(10, 10, 10)),
			// Math.random() > 0.5
			// 	? new Physics3SphereColliderComponent(5 + 10 * Math.random())
			// 	: new Physics3BoxColliderComponent(
			// 			new Vector3(5 + 10 * Math.random(), 5 + 10 * Math.random(), 5 + 10 * Math.random())
			// 	  ),
			// new MeshRendererComponent(mesh, mat),
		])
);

const ground = new Entity('Ground', [
	new TransformComponent(new Vector3(0, canvasEl.height / -2, 0)),
	new Physics3BodyComponent(Physics3BodyType.Static, 0),
	new Physics3PlaneColliderComponent(),
]);

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -600),
	camera: {
		fov: 90,
		near: 0.1,
		far: 2000,
		zoom: 2,
	},
});

const camComp = cam.getComponent(CameraComponent)!;
camComp.showDebug = true;

const scene = new Scene([new Physics3EngineComponent()], [cam, ground, ...objs]);

engine.loadScene(scene);
engine.start();

engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / -2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / -2 + 100, canvasEl.height / -2, 0)
	),
	100 * 3600,
	new Color(1)
);
engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / -2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / -2, canvasEl.height / -2 + 100, 0)
	),
	100 * 3600,
	new Color(0, 1)
);
engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / -2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / -2, canvasEl.height / -2, -100)
	),
	100 * 3600,
	new Color(0, 0, 1)
);

engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / 2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / 2 - 100, canvasEl.height / -2, 0)
	),
	100 * 3600,
	new Color(1)
);
engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / 2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / 2, canvasEl.height / -2 + 100, 0)
	),
	100 * 3600,
	new Color(0, 1)
);
engine.debug.drawLine(
	new Line3(
		new Vector3(canvasEl.width / 2, canvasEl.height / -2, 0),
		new Vector3(canvasEl.width / 2, canvasEl.height / -2, -100)
	),
	100 * 3600,
	new Color(0, 0, 1)
);
