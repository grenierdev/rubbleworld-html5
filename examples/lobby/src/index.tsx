import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture, TextureWrap, TextureFilter } from '@fexel/core/rendering/Texture';
import { Debug } from '@fexel/core/Debug';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { CameraPerspectivePrefab, CameraPerspectiveComponent } from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';
import { Shader, ShaderType } from '@fexel/core/rendering/Shader';

const stats = new Stats(340);
stats.canvas.style.opacity = '0.9';
document.body.appendChild(stats.canvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const tex = new Texture(
	document.getElementById('uvdebug')! as HTMLImageElement,
	TextureWrap.CLAMP_TO_EDGE,
	TextureFilter.LINEAR
);

const material = new Material(
	new Shader(
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
	`,
		ShaderType.Vertex
	),
	new Shader(
		`
		precision mediump float;

		varying vec2 fragUV;
		uniform sampler2D sampler;

		void main(void) {
			gl_FragColor = vec4(texture2D(sampler, fragUV).xyz, 0.25);
		}
	`,
		ShaderType.Fragment
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
	willMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update() {
		if (this.transform) {
			this.transform.localPosition.set(
				Math.sin(Math.max(0, performance.now()) / 500),
				Math.cos(Math.max(0, performance.now()) / 500),
				Math.cos(Math.max(0, performance.now()) / 100)
			);
		}
	}
}

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		aspect: canvasEl.width / canvasEl.height,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});
// cam.getComponent(CameraPerspectiveComponent)!.viewport.max.set(0.5, 0.5);

const obj = new Entity('UV')
	.addComponent(new TransformComponent())
	.addComponent(new MoverComponent())
	.addComponent(new MeshRendererComponent(mesh, material));

const scene = new Scene().addChild(cam).addChild(obj);

engine.loadScene(scene);
engine.start();

// setInterval(() => console.log(engine.stats.drawCalls), 1000);

// Debug.setRenderingContext(engine.gl);
// Debug.drawPrimitivePoints([0, 0, 0], 10, { ttl: 0.0, color: [1, 1, 1, 1] });

// 	// Debug.drawPrimitivePoints([0 + Math.random(), -1 + Math.random() * 2, 0], 2, {
// 	// 	ttl: 1.0,
// 	// 	color: [Math.random(), Math.random(), Math.random(), 1],
// 	// });
// 	// Debug.drawPrimitiveLine(
// 	// 	[
// 	// 		-1 + Math.random() * 1,
// 	// 		-1 + Math.random() * 2,
// 	// 		0,
// 	// 		-1 + Math.random() * 1,
// 	// 		-1 + Math.random() * 2,
// 	// 		0,
// 	// 	],
// 	// 	{
// 	// 		ttl: 1.0,
// 	// 		color: [Math.random(), Math.random(), Math.random(), 1],
// 	// 	}
// 	// );

// 	Debug.draw(
// 		camCamera.transform!.worldMatrix,
// 		camCamera.camera.projectionMatrix
// 	);
// 	Debug.update();
