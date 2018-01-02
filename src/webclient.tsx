import { Engine } from "./engine";
import { Scene } from "./engine/core/Scene";
import { NullEntity } from "./engine/core/Entity";

const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 400;

document.body.appendChild(canvas);

(async () => {
	const gl = canvas.getContext('webgl')!;
	gl.viewport(0, 0, canvas.width, canvas.height);

	const engine = new Engine(gl);
	const player = new NullEntity();
	const scene = new Scene();

	scene.addChild(player);

	const players = scene.getChildrenByType(NullEntity);

	console.log(players);

// 	const material = await engine.createMaterial(`
// attribute vec3 a_position;
// attribute vec2 a_uv;

// varying vec2 v_uv;
// void main() {
// 	gl_Position = vec4(a_position, 1);
// 	v_uv = a_uv;
// }
// `, `
// precision mediump float;
// uniform sampler2D u_tex;
// varying vec2 v_uv;

// void main() {
// 	gl_FragColor = texture2D(u_tex, v_uv);
// }
// `);

	function render() {
		engine.update();
		engine.render();
		requestAnimationFrame(render);
	}
	render();
})();

