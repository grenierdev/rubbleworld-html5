import { Shader } from '../../rendering/Shader';

Shader.registerInclude(
	'lighting/light.vert',
	`
	const int MAX_NUM_LIGHT = 4;
	struct Light {
		vec3 Position;
		vec3 Direction;
		vec3 Color;
		float Intensity;
	};
	uniform Light uLights[MAX_NUM_LIGHT];
`
);

Shader.registerInclude(
	'lighting/shadow/directionnal.vert',
	`
	const int MAX_NUM_DIR_SHADOW = 4;
	uniform mat4 uDirectionalShadowTransform[MAX_NUM_DIR_SHADOW];
	varying vec4 vDirectionalShadowPosition[MAX_NUM_DIR_SHADOW];

	void CalcDirectionalShadowPosition(vec4 position) {
		for (int i = 0; i < MAX_NUM_DIR_SHADOW; ++i) {
			vDirectionalShadowPosition[i] = uDirectionalShadowTransform[i] * position;
		}
	}
`
);

Shader.registerInclude(
	'lighting/shadow/directionnal.frag',
	`
	const int MAX_NUM_DIR_SHADOW = 4;
	uniform sampler2D uDirectionalShadowMap[MAX_NUM_DIR_SHADOW];
	varying vec4 vDirectionalShadowPosition[MAX_NUM_DIR_SHADOW];

	bool InShadow(vec4 position_in_shadow, sampler2D shadowmap) {
		vec3 shadowUV = position_in_shadow.xyz / position_in_shadow.w;
		shadowUV = shadowUV * 0.5 + 0.5;
		float depth = texture2D(shadowmap, shadowUV.xy).r;

		// cosTheta is dot( n,l ), clamped between 0 and 1
		// float bias = 0.001 * tan(acos(cosTheta));
		float bias = 0.001;
		bias = clamp(bias, 0.0, 0.01);

		return shadowUV.z >= depth + bias;
	}
`
);
