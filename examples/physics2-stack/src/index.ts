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
} from '@fexel/core/components/Physics2';
import { Box2 } from '@fexel/core/math/Box2';
import { Vector2 } from '@fexel/core/math/Vector2';
import { Circle } from '@fexel/core/math/Circle';

const stats = new Stats(340);
stats.canvas.style.opacity = '0.9';
document.body.appendChild(stats.canvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const objs = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map(
	() =>
		new Entity('Obj', [
			new TransformComponent(
				new Vector3(50 + (canvasEl.width - 100) * Math.random(), 50 + (canvasEl.height - 100) * Math.random(), 0)
			),
			new Physics2BodyComponent({ static: Math.random() > 0.5 }),
			new Physics2BoxColliderComponent(
				new Box2().setFromCenterAndSize(Vector2.Zero, new Vector2(10 + 15 * Math.random(), 10 + 15 * Math.random()))
			),
			// new Physics2CircleColliderComponent(new Circle(new Vector2(), 10 + 15 * Math.random())),
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
			new Physics2BodyComponent({ static: true }),
			new Physics2BoxColliderComponent(new Box2().setFromCenterAndSize(Vector2.Zero, new Vector2(size[2], size[3]))),
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

const scene = new Scene([new Physics2EngineComponent()], [cam, ...walls, ...objs]);

engine.loadScene(scene);
engine.start();
