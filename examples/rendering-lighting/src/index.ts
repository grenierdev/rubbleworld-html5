import { RenderableEngine } from '@fexel/core/Engine';
import { Stats } from '@fexel/core/Stats';
import { Mesh } from '@fexel/core/rendering/Mesh';
import { PlaneGeometry } from '@fexel/core/geometries/Plane';
import { BoxGeometry } from '@fexel/core/geometries/Box';
import { SphereGeometry } from '@fexel/core/geometries/Sphere';
import { Texture, TextureFormat, TextureType } from '@fexel/core/rendering/Texture';
import { VertexShader, FragmentShader } from '@fexel/core/rendering/Shader';
import { Material } from '@fexel/core/rendering/Material';
import { Entity, Scene, Component } from '@fexel/core/Scene';
import { TransformComponent } from '@fexel/core/components/Transform';
import { Vector3 } from '@fexel/core/math/Vector3';
import { CameraPerspectivePrefab, CameraComponent, CameraOrthographicPrefab } from '@fexel/core/components/Camera';
import { MeshRendererComponent } from '@fexel/core/components/MeshRenderer';
import { DEG2RAD } from '@fexel/core/math/util';
import { Euler } from '@fexel/core/math/Euler';
import { DirectionalLightComponent, LightComponent } from '@fexel/core/components/Light';
import { Color } from '@fexel/core/math/Color';
import { Vector2 } from '@fexel/core/math/Vector2';
import { UnlitSampledMaterial } from '@fexel/core/materials/UnlitSampled';
import { UnlitMaterial } from '@fexel/core/materials/Unlit';
import { RenderTargetAttachment } from '@fexel/core/rendering/RenderTarget';

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
		precision mediump int;
		precision mediump float;

		const int maxLightCount = 4;
		struct light {
			int type;
			vec3 position;
			vec3 direction;
			float intensity;
			vec3 color;
			mat4 shadowtransform;
		};

		attribute vec3 Position0;
		attribute vec3 Normal0;
		attribute vec2 UV0;
		uniform mat4 ProjectionMatrix;
		uniform mat4 WorldMatrix;
		uniform mat4 ModelMatrix;
		uniform int LightCount;
		uniform light Lights[maxLightCount];
		uniform sampler2D ShadowTextures[maxLightCount];
		varying vec3 v_Normal;
		varying vec2 v_UV;
		varying vec4 v_ShadowPosition[maxLightCount];

		const mat4 texUnitConverter = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

		void main(void) {
			for (int i = 0; i < maxLightCount; ++i) {
				if (i < LightCount) {
					v_ShadowPosition[i] = texUnitConverter * Lights[i].shadowtransform * vec4(Position0, 1.0);
				}
			}
			v_UV = UV0;
			v_Normal = mat3(WorldMatrix) * mat3(ModelMatrix) * Normal0;
			gl_Position = ProjectionMatrix * WorldMatrix * ModelMatrix * vec4(Position0, 1.0);
		}
	`
);
const fragShader = new FragmentShader(
	`
		precision mediump int;
		precision mediump float;

		const int maxLightCount = 4;
		struct light {
			int type;
			vec3 position;
			vec3 direction;
			float intensity;
			vec3 color;
			mat4 shadowtransform;
		};

		uniform int LightCount;
		uniform light Lights[maxLightCount];
		uniform sampler2D ShadowTextures[maxLightCount];
		uniform vec3 Ambient;
		uniform sampler2D Texture0;

		varying vec3 v_Normal;
		varying vec2 v_UV;
		varying vec4 v_ShadowPosition[maxLightCount];

		void main(void) {
			vec4 color = texture2D(Texture0, v_UV);
			// vec3 color = vec3(1.0);
			
			gl_FragColor = vec4(color.xyz, 1.0);
			
			// vec3 normal = normalize(v_Normal);
			// vec3 shading = vec3(0);
			// float light = max(dot(normal, -Lights[0].direction), 0.0);
			// shading = Lights[0].color * light * Lights[0].intensity;

			// vec3 shadowUV = v_ShadowPosition[0].xyz / v_ShadowPosition[0].w;
			// gl_FragColor = vec4(shadowUV.xy, 0.0, 1.0);

			// gl_FragColor = vec4(v_ShadowPosition[0].x, v_ShadowPosition[0].z, 0.0, 1.0);
			
			// float depth = texture2D(ShadowTextures[0], v_ShadowPosition[0].xy).r;
			// gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);

			// // float depth = texture2D(ShadowTextures[0], shadowUV.xy).r;
			// // gl_FragColor = vec4(depth, shadowUV.z, 0.0, 1.0);

			// // if (shadowUV.z <= depth) {
			// // 	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
			// // } else {
			// // 	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
			// // }

			// // vec3 color = vec3(1.0);
			// // vec3 normal = normalize(v_Normal);
			
			// // vec3 lighting = LightCalc(normal);
			// // float shadow = 1.0 - ShadowCalc();
			// // gl_FragColor = vec4(0.0, shadow, 0.0, 1.0);
			// // // vec3 final = color * Ambient + color * lighting * shadow;
			// // // gl_FragColor = vec4(final, 1.0);
		}
	`
);

// const matUV = new Material(vertShader, fragShader);
const matUV = new UnlitSampledMaterial();
// const matUV = new UnlitMaterial();
matUV.uniforms.Texture0 = texUV;

class MoverComponent extends Component {
	public transform: TransformComponent | undefined;
	constructor(public offset = new Vector3()) {
		super();
	}
	didMount() {
		this.transform = this.getComponent(TransformComponent);
	}
	update({ time }) {
		if (this.transform) {
			this.transform.localPosition.set(
				this.offset.x + Math.sin(Math.max(0, time) / 500),
				// Math.cos(Math.max(0, time) / 500),
				this.offset.y,
				this.offset.z + Math.cos(Math.max(0, time) / 100)
			);
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

const box = new BoxGeometry(1, 1, 1);
const meshBox = new Mesh(box.meshData);
const objBox = new Entity('Box', [
	new TransformComponent(),
	new MeshRendererComponent(meshBox, matUV),
	new MoverComponent(new Vector3(-1, 1, 0)),
]);

const sphere = new SphereGeometry(0.5);
const meshSphere = new Mesh(sphere.meshData);
const objSphere = new Entity('Sphere', [
	new TransformComponent(),
	new MeshRendererComponent(meshSphere, matUV),
	new MoverComponent(new Vector3(1, 1, 0)),
]);

const light1 = new Entity('Light', [
	new TransformComponent(new Vector3(0, 0, 0), new Euler(-90 * DEG2RAD, 0, 0)),
	new DirectionalLightComponent(
		{
			intensity: 1.0,
			color: new Color().fromRGBA(231, 210, 179),
			shadowMap: new Texture({
				width: 1024,
				height: 1024,
				// internalFormat: TextureFormat.DEPTH_COMPONENT,
				// format: TextureFormat.DEPTH_COMPONENT,
				// type: TextureType.UNSIGNED_INT,
			}),
		},
		-1,
		10
	),
]);
light1.getComponent(LightComponent)!.visibilityFlag ^= 2;

Material.globals.Ambient = new Color(0.1, 0.1, 0.1);

const cam = CameraPerspectivePrefab({
	position: new Vector3(0, 2, 20),
	camera: {
		fov: 40,
		near: 0.1,
		far: 100.0,
		zoom: 1,
	},
});
cam.getComponent(CameraComponent)!.viewport.max.set(0.5, 1.0);
cam.getComponent(CameraComponent)!.visibilityFlag ^= 2;
cam.getComponent(CameraComponent)!.showDebug = true;

const camDebug1 = CameraOrthographicPrefab({
	position: new Vector3(0, 0, 0),
	rotation: new Euler(),
	camera: {
		left: -0.5,
		right: 0.5,
		top: -0.5,
		bottom: 0.5,
		near: -1,
		far: 10,
		zoom: 1,
	},
});
camDebug1.getComponent(CameraComponent)!.backgroundColor = Color.White;
camDebug1.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.75, 0.25), new Vector2(0.5, 0.5));
camDebug1.getComponent(CameraComponent)!.visibilityFlag = 2;

const camDebug2 = CameraOrthographicPrefab({
	position: new Vector3(0, 0, 0),
	rotation: new Euler(-90 * DEG2RAD, 0, 0),
	camera: {
		left: -5,
		right: 5,
		top: -5,
		bottom: 5,
		near: -1,
		far: 10,
		zoom: 1,
	},
});
// camDebug2.getComponent(CameraComponent)!.backgroundColor = Color.White;
camDebug2.getComponent(CameraComponent)!.viewport.setFromCenterAndSize(new Vector2(0.75, 0.75), new Vector2(0.5, 0.5));
camDebug2.getComponent(CameraComponent)!.visibilityFlag ^= 2;

const shadowMat = new UnlitSampledMaterial();
shadowMat.uniforms.Texture0 = light1.getComponent(LightComponent)!.shadowMap!;
const shadowPlane = new Entity('Plane', [
	new TransformComponent(new Vector3(0, 0, 0)),
	new MeshRendererComponent(new Mesh(new PlaneGeometry(1, 1).meshData), shadowMat),
]);
shadowPlane.getComponent(MeshRendererComponent)!.visibilityFlag = 2;

const scene = new Scene().addChild(cam, camDebug1, camDebug2, light1, objPlane, objBox, objSphere, shadowPlane);
// const scene = new Scene().addChild(cam, camDebug2, objPlane, objBox, objSphere, shadowPlane);
// const scene = new Scene().addChild(cam, light1, objPlane, objBox, objSphere);

engine.loadScene(scene);
engine.start();

engine.debug.drawPoint(new Vector3(0, 0, 0), 20, 3600, new Color(1, 0, 0, 1));
engine.debug.drawPoint(new Vector3(2.5, 0, 0), 20, 3600, new Color(0, 1, 0, 1));
