import { Material } from "../common/engine/rendering/Material";
import { Matrix4 } from "../common/engine/math/Matrix4";
import { CameraOrthographic, CameraPerspective } from "../common/engine/rendering/Camera";
import { Vector3 } from "../common/engine/math/Vector3";
import { Quaterion } from "../common/engine/math/Quaterion";
import { Mesh } from "../common/engine/rendering/Mesh";
import { Texture } from "../common/engine/rendering/Texture";

// Source: http://learningwebgl.com/blog/?p=28

const canvasEl = document.getElementById("canvas")! as HTMLCanvasElement;
const width = canvasEl.width;
const height = canvasEl.height;

const gl = canvasEl.getContext('webgl', {
	alpha: false,
	antialias: false,
	depth: true,
	stencil: false
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

const material2 = new Material(
	gl,
	`
		attribute vec3 vertPosition;

		uniform mat4 projectionMatrix;
		uniform mat4 viewMatrix;
		uniform mat4 worldMatrix;

		void main(void) {
			gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertPosition, 1.0);
		}
	`,
	`
		precision mediump float;

		void main(void) {
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
	`
);

const mesh = new Mesh(
	gl,
	{
		vertices: [
			1.0, 1.0, 0.0,
			-1.0, 1.0, 0.0,
			1.0, -1.0, 0.0,
			-1.0, -1.0, 0.0
		],
		indices: [
			0, 1, 2,
			2, 1, 3
		],
		uvs: [
			[
				1, 0,
				0, 0,
				1, 1,
				0, 1
			]
		],
		colors: [
			[
				1, 0, 1, 1,
				1, 0, 1, 1,
				1, 0, 1, 1,
				1, 0, 1, 1
			]
		]
	}
);

const tex = new Texture(
	gl,
	document.getElementById('uvdebug')! as HTMLImageElement,
	gl.CLAMP_TO_EDGE,
	gl.LINEAR
);

const position = new Vector3(0, 0, -8);
const rotation = new Quaterion();
const view = new Matrix4();
const world = new Matrix4().compose(position, rotation, Vector3.One);
const camera = new CameraPerspective(45, width / height, 0.1, 100.0, 2);
// const camera = new CameraOrthographic(-250, 250, -250, 250, 0.1, 100, 1);

material2.setUniform('worldMatrix', world.elements.concat());
material2.setUniform('viewMatrix', view.elements);
material2.setUniform('projectionMatrix', camera.projectionMatrix.elements);
material2.bind();
// mesh.bind();

material.setUniform('worldMatrix', world.elements);
material.setUniform('viewMatrix', view.elements);
material.setUniform('projectionMatrix', camera.projectionMatrix.elements);
material.setUniform('sampler', tex);
material.bind();
// tex.bind();
// mesh.bind();

let frameId = 0;
(function draw() {
	++frameId;
	gl.viewport(0, 0, width, height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.depthFunc(gl.LESS);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	// Enable transparency
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);

	// for (let i = 20; --i >= 0;) {

		// rotation.y = Math.sin(Math.max(0, frameId - i * 10) / 20);
		// position.x = Math.sin(Math.max(0, frameId - i * 10) / 20);
		// position.y = Math.cos(Math.max(0, frameId - i * 10) / 20);
		// world.compose(position, rotation, Vector3.One);
		// world.elements[12] = Math.sin(Math.max(0, frameId - i * 10) / 20);
		// world.elements[13] = Math.cos(Math.max(0, frameId - i * 10) / 20);

		// Use material set attribute & uniform
		// material.bind();
		// material.setUniform('worldMatrix', world.elements);
		// mesh.draw();

	// }

	material2.bind();
	mesh.bind();
	mesh.draw();

	world.elements[12] = Math.sin(Math.max(0, frameId) / 20);
	world.elements[13] = Math.cos(Math.max(0, frameId) / 20);
	material.setUniform('worldMatrix', world.elements);
	material.bind();
	mesh.bind();
	mesh.draw();

	requestAnimationFrame(draw);
})();