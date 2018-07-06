import { Material } from "../common/engine/rendering/Material";
import { Matrix4 } from "../common/engine/math/Matrix4";
import { CameraOrthographic, CameraPerspective } from "../common/engine/rendering/Camera";
import { Vector3 } from "../common/engine/math/Vector3";
import { Quaterion } from "../common/engine/math/Quaterion";

// Source: http://learningwebgl.com/blog/?p=28

const canvasEl = document.getElementById("canvas")! as HTMLCanvasElement;
const width = canvasEl.width;
const height = canvasEl.height;

const gl = canvasEl.getContext('webgl')!;
gl.viewport(0, 0, width, height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

const material = new Material(
	gl,
	`
		attribute vec3 vertexPosition;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		void main(void) {
			gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
		}
	`,
	`
		precision mediump float;

		void main(void) {
			gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
		}
	`
);

// Missing in Material ?
gl.enableVertexAttribArray(material.attributeLocations.get('vertexPosition')!);

// Mesh data ?
const vertexPositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0,  1.0,  0.0, -1.0,  1.0,  0.0, 1.0, -1.0,  0.0, -1.0, -1.0,  0.0]), gl.STATIC_DRAW);
const vertexPositionBufferSize = 3;
const vertexPositionBufferItems = 4;

// const modelView = new Matrix4().makeTranslation(1.5, 0.0, -7.0);
const position = new Vector3(0, 0, -7);
const rotation = new Quaterion();
const modelView = new Matrix4().compose(position, rotation, Vector3.One);
const camera = new CameraPerspective(45, width / height, 0.1, 100.0, 1);

let frameId = 0;
(function draw() {
	++frameId;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	rotation.y = Math.sin(frameId / 20);
	position.x = Math.sin(frameId / 20);
	position.y = Math.cos(frameId / 20);
	// modelView.elements[12] = position.x;
	// modelView.elements[13] = position.y;
	modelView.compose(position, rotation, Vector3.One);

	// Use material set attribute & uniform
	material.bind();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.vertexAttribPointer(material.attributeLocations.get('vertexPosition')!, vertexPositionBufferSize, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(material.uniformLocations.get('modelViewMatrix')!, false, modelView.elements);
	gl.uniformMatrix4fv(material.uniformLocations.get('projectionMatrix')!, false, camera.projectionMatrix.elements);

	// Draw
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBufferItems);

	requestAnimationFrame(draw);
})();