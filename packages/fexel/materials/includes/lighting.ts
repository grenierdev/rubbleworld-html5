import { Shader } from '../../rendering/Shader';

Shader.registerInclude(
	'lighting.vert',
	`
	#include lighting/shadow/directionnal.vert;

	void CalcShadowPosition(in vec4 position) {
		#if (defined(MAX_NUM_DIR_SHADOW) && MAX_NUM_DIR_SHADOW > 0)
			CalcDirectionalShadowPosition(position);
		#endif
	}
	`
);

Shader.registerInclude(
	'lighting.frag',
	`
	#include lighting/shadow/directionnal.frag;

	struct Light {
		int Type;
		vec3 Position;
		vec3 Direction;
		vec3 Color;
	};
	uniform Light uLights[MAX_NUM_LIGHT];
	uniform vec3 uAmbient;
	uniform vec3 uViewPosition;

	const float MAX_NUM_LIGHT_INV = 1.0 / float(MAX_NUM_LIGHT);

	vec3 CalcLighting(in vec3 color, in float shininess, in vec3 position, in vec3 normal) {
		vec3 N = normalize(normal);
		vec3 S = normalize(uViewPosition - position);
		vec3 lighting = vec3(0.0);

		for (int i = 0; i < MAX_NUM_LIGHT; ++i) {
			vec3 L = normalize(uLights[i].Position - position);
			if (uLights[i].Type == 1) {
				L = normalize(uLights[i].Direction);
			}

			vec3 R = reflect(L, N);

			float cosTheta = clamp(dot(N, L), 0.0, 1.0);
			float cosAlpha = clamp(dot(S, R), 0.0, 1.0);

			vec3 diffuse = cosTheta * uLights[i].Color * color;
			vec3 specular = pow(cosAlpha, shininess) * uLights[i].Color;
			
			lighting += (diffuse + specular) / MAX_NUM_LIGHT_INV;
		}

		return lighting;
	}

	float CalcShadow(in float bias) {
		// float bias = clamp(0.005 * tan(acos(cosTheta)), 0.0, 0.01);
		
		float factor = 0.0;
		float numShadows = 0.0;

		#if (defined(MAX_NUM_DIR_SHADOW) && MAX_NUM_DIR_SHADOW > 0)
			numShadows += float(MAX_NUM_DIR_SHADOW);
		#endif

		float p = 1.0 / numShadows;

		#if (defined(MAX_NUM_DIR_SHADOW) && MAX_NUM_DIR_SHADOW > 0)
			for (int i = 0; i < MAX_NUM_DIR_SHADOW; ++i) {
				#ifdef SHADOWMAP_TYPE_PCF
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(-0.94201624, -0.39906216) / SHADOWMAP_PCF_SPREAD, uDirectionalShadowMap[i], bias) ? p / 5.0 : 0.0;
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(0.94558609, -0.76890725) / SHADOWMAP_PCF_SPREAD, uDirectionalShadowMap[i], bias) ? p / 5.0 : 0.0;
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(-0.094184101, -0.92938870) / SHADOWMAP_PCF_SPREAD, uDirectionalShadowMap[i], bias) ? p / 5.0 : 0.0;
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(0.34495938, 0.29387760) / SHADOWMAP_PCF_SPREAD, uDirectionalShadowMap[i], bias) ? p / 5.0 : 0.0;
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(0.0), uDirectionalShadowMap[i], bias) ? p / 5.0 : 0.0;
				#else
					factor += InDirectionalShadow(vDirectionalShadowPosition[i], vec2(0.0), uDirectionalShadowMap[i], bias) ? p : 0.0;
				#endif
			}
		#endif

		return 1.0 - factor;
	}
`
);

Shader.registerInclude(
	'lighting/shadow/directionnal.vert',
	`
	#if (defined(MAX_NUM_DIR_SHADOW) && MAX_NUM_DIR_SHADOW > 0)
		uniform mat4 uDirectionalShadowTransform[MAX_NUM_DIR_SHADOW];
		varying vec4 vDirectionalShadowPosition[MAX_NUM_DIR_SHADOW];

		void CalcDirectionalShadowPosition(in vec4 position) {
			for (int i = 0; i < MAX_NUM_DIR_SHADOW; ++i) {
				vDirectionalShadowPosition[i] = uDirectionalShadowTransform[i] * position;
			}
		}
	#endif
`
);

Shader.registerInclude(
	'lighting/shadow/directionnal.frag',
	`
	#ifndef SHADOWMAP_PCF_SPREAD
		#define SHADOWMAP_PCF_SPREAD 200.0
	#endif

	#if (defined(MAX_NUM_DIR_SHADOW) && MAX_NUM_DIR_SHADOW > 0)
		uniform sampler2D uDirectionalShadowMap[MAX_NUM_DIR_SHADOW];
		varying vec4 vDirectionalShadowPosition[MAX_NUM_DIR_SHADOW];

		bool InDirectionalShadow(in vec4 position_in_shadow, in vec2 offset, in sampler2D shadowmap, in float bias) {
			vec3 shadowUV = position_in_shadow.xyz / position_in_shadow.w;
			shadowUV = shadowUV * 0.5 + 0.5;
			float depth = texture2D(shadowmap, shadowUV.xy + offset).r;

			return shadowUV.z >= depth + bias;
		}
	#endif
`
);
