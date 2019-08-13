import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { BoxGeometry } from '@fexel/core/geometries/Box';
import { SphereGeometry } from '@fexel/core/geometries/Sphere';
import { Texture } from '@fexel/core/rendering/Texture';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Material } from '@fexel/core/rendering/Material';
import { Entity, Scene, Component } from '@fexel/core/Scene';
import { TransformComponent } from '@fexel/core/components/Transform';
import { Vector3 } from '@fexel/core/math/Vector3';
import { CameraPerspectivePrefab } from '@fexel/core/components/Camera';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { DEG2RAD } from '@fexel/core/math/util';
import { Euler } from '@fexel/core/math/Euler';
import { DirectionalLightComponent } from '@fexel/core/components/Light';
import { Color } from '@fexel/core/math/Color';

const stats = new Stats();
stats.graphCanvas.style.opacity = '0.9';
document.body.appendChild(stats.graphCanvas);
document.body.appendChild(stats.labelCanvas);
setInterval(() => stats.update(), 1000 / 30);

const canvasEl = document.getElementById('canvas')! as HTMLCanvasElement;
const engine = ((window as any).engine = new RenderableEngine(canvasEl, stats));

const texUV = new Texture({
	data: document.getElementById('uvdebug')! as HTMLImageElement,
});

const vertShader = new VertexShader(
	`
		attribute vec3 Position0;
		attribute vec3 Normal0;
		attribute vec2 UV0;
		uniform mat4 ProjectionMatrix;
		uniform mat4 WorldMatrix;
		uniform mat4 ModelMatrix;
		varying vec3 v_Normal;
		varying vec2 v_UV;

		void main(void) {
			v_UV = UV0;
			v_Normal = mat3(WorldMatrix) * mat3(ModelMatrix) * Normal0;
			gl_Position = ProjectionMatrix * WorldMatrix * ModelMatrix * vec4(Position0, 1.0);
		}
	`
);
const fragShader = new FragmentShader(
	`
		precision mediump float;

		struct light {
			int type;
			vec3 position;
			vec3 direction;
			float intensity;
			vec3 color;
		};

		uniform sampler2D Sampler;
		uniform int LightCount;
		uniform light Lights[8];
		uniform vec3 Ambient;

		varying vec3 v_Normal;
		varying vec2 v_UV;

		vec3 LightCalc(vec3 normal, light Light) {
			vec3 lighting = vec3(0);
			if (Light.type == 0) {
				float light = max(dot(normal, -Light.direction), 0.0);
				lighting = Light.color * light * Light.intensity;
			}

			return lighting;
		}

		void main(void) {
			// vec3 color = texture2D(Sampler, v_UV).xyz;
			vec3 color = vec3(1);
			vec3 normal = normalize(v_Normal);

			vec3 lighting = vec3(0);
			for (int i = 0; i < 8; ++i) {
				lighting += LightCalc(normal, Lights[i]);
			}

			vec3 final = color * Ambient + color * lighting;

			gl_FragColor = vec4(final, 1.0);
		}
	`
);

const matUV = new Material(vertShader, fragShader);
matUV.setUniform('Sampler', texUV);

class MoverComponent extends Component {
	public transform: TransformComponent | undefined;
	didMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update({ time }) {
		if (this.transform) {
			this.transform.localRotation.set(
				this.transform.localRotation.x + 1 * DEG2RAD,
				this.transform.localRotation.y + 1 * DEG2RAD,
				this.transform.localRotation.z + 1 * DEG2RAD
			);
		}
	}
}

const plane = new PlaneGeometry(100, 100);
const meshPlane = new Mesh(plane.meshData);
const objPlane = new Entity('Plane', [
	new TransformComponent(new Vector3(0, 0, 0), new Euler(-90 * DEG2RAD, 0, 0)),
	new MeshRendererComponent(meshPlane, matUV),
]);

const box = new BoxGeometry(1, 1);
const meshBox = new Mesh(box.meshData);
const objBox = new Entity('Box', [
	new TransformComponent(new Vector3(-1, 1, 0)),
	new MeshRendererComponent(meshBox, matUV),
	new MoverComponent(),
]);

const sphere = new SphereGeometry(0.5);
const meshSphere = new Mesh(sphere.meshData);
const objSphere = new Entity('Sphere', [
	new TransformComponent(new Vector3(1, 1, 0)),
	new MeshRendererComponent(meshSphere, matUV),
	new MoverComponent(),
]);

const light1 = new Entity('Light', [
	new TransformComponent(new Vector3(1, 1, 0)),
	new DirectionalLightComponent({
		direction: new Euler(0, -1, 0),
		intensity: 1.0,
		color: new Color().fromRGBA(231, 210, 179),
	}),
]);

const light2 = new Entity('Light', [
	new TransformComponent(new Vector3(1, 1, 0)),
	new DirectionalLightComponent({
		direction: new Euler(0, 1, -0.5),
		intensity: 0.2,
		color: new Color().fromRGBA(118, 132, 232),
	}),
]);

Material.globals.set('Ambient', [0.1, 0.1, 0.1]);

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 2, 10),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 1,
	},
});

const scene = new Scene().addChild(cam, light1, light2, objPlane, objBox, objSphere);

engine.loadScene(scene);
engine.start();
