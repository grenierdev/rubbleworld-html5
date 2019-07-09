import { Material } from '@fexel/core/rendering/Material';
import { Vector3 } from '@fexel/core/math/Vector3';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { Texture } from '@fexel/core/rendering/Texture';
import { Debug } from '@fexel/core/Debug';
import { Scene, Entity, Component } from '@fexel/core/Scene';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import {
	CameraPerspectiveComponent,
	CameraPerspectivePrefab,
} from '@fexel/core/components/Camera';
import { TransformComponent } from '@fexel/core/components/Transform';

// Source: http://learningwebgl.com/blog/?p=28

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const width = canvasEl.width;
const height = canvasEl.height;

const gl = canvasEl.getContext('webgl', {
	alpha: false,
	antialias: false,
	depth: true,
	stencil: false,
})!;

const material = new Material(
	gl,
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
	`
		precision mediump float;

		varying vec2 fragUV;
		uniform sampler2D sampler;

		void main(void) {
			gl_FragColor = vec4(texture2D(sampler, fragUV).xyz, 0.25);
		}
	`
);
material.twoSided = true;
material.transparent = false;

const mesh = new Mesh(gl, {
	vertices: new Float32Array([
		1.0,
		1.0,
		0.0,
		-1.0,
		1.0,
		0.0,
		1.0,
		-1.0,
		0.0,
		-1.0,
		-1.0,
		0.0,
	]),
	indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
	uvs: [new Float32Array([1, 0, 0, 0, 1, 1, 0, 1])],
	colors: [new Float32Array([1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1])],
});

const tex = new Texture(
	gl,
	document.getElementById('uvdebug')! as HTMLImageElement,
	gl.CLAMP_TO_EDGE,
	gl.LINEAR
);

class MoverComponent extends Component {
	public transform: TransformComponent | undefined;
	willMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update() {
		if (this.transform) {
			this.transform.localPosition.x = Math.sin(
				Math.max(0, performance.now()) / 1000
			);
			this.transform.localPosition.y = Math.cos(
				Math.max(0, performance.now()) / 1000
			);
		}
	}
}

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 0, -10),
	camera: {
		fov: 40,
		aspect: width / height,
		near: 0.1,
		far: 100.0,
		zoom: 2,
	},
});

const obj = new Entity('UV')
	.addComponent(new TransformComponent())
	.addComponent(new MoverComponent())
	.addComponent(new MeshRendererComponent(mesh, material));

const scene = new Scene().addChild(cam).addChild(obj);

Debug.setRenderingContext(gl);

let frameId = 0;
(window as any).step = function step() {
	++frameId;

	gl.viewport(0, 0, width, height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.depthFunc(gl.LESS);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	const camCamera = cam.getComponent(CameraPerspectiveComponent)!;
	const objRenderer = obj.getComponent(MeshRendererComponent)!;

	const updater = scene.update();
	while (updater.next().done !== true) {
		// noop;
	}

	objRenderer.material.setUniform('sampler', tex);
	objRenderer.render(camCamera);

	objRenderer.material.bind();
	objRenderer.mesh.draw();

	Debug.drawPrimitivePoints([0, 0, 0], 10, { ttl: 0.0, color: [1, 1, 1, 1] });

	// Debug.drawPrimitivePoints([0 + Math.random(), -1 + Math.random() * 2, 0], 2, {
	// 	ttl: 1.0,
	// 	color: [Math.random(), Math.random(), Math.random(), 1],
	// });
	// Debug.drawPrimitiveLine(
	// 	[
	// 		-1 + Math.random() * 1,
	// 		-1 + Math.random() * 2,
	// 		0,
	// 		-1 + Math.random() * 1,
	// 		-1 + Math.random() * 2,
	// 		0,
	// 	],
	// 	{
	// 		ttl: 1.0,
	// 		color: [Math.random(), Math.random(), Math.random(), 1],
	// 	}
	// );

	Debug.draw(
		camCamera.transform.worldMatrix,
		camCamera.camera.projectionMatrix
	);
	Debug.update();
};
