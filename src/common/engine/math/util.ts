
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

/**
 * https://en.wikipedia.org/wiki/Modulo_operation
 */
export function euclideanModulo(n: number, m: number) {
	return ((n % m) + m) % m;
}

export function mapLinear(a1: number, a2: number, b1: number, b2: number, t: number) {
	return b1 + (t - a1) * (b2 - b1) / (a2 - a1);
}

/**
 * https://en.wikipedia.org/wiki/Linear_interpolation
 */
export function lerp(from: number, to: number, t: number) {
	return (1 - t) * from + t * to;
}

/**
 * http://en.wikipedia.org/wiki/Smoothstep
 */
export function smoothstep(value: number, min: number, max: number) {
	if (value <= min) return 0;
	if (value >= max) return 1;
	value = (value - min) / (max - min);
	return value * value * (3 - 2 * value);
}

export function smootherstep(value: number, min: number, max: number) {
	if (value <= min) return 0;
	if (value >= max) return 1;
	value = (value - min) / (max - min);
	return value * value * value * (value * (value * 6 - 15) + 10);
}

export function randomInt(low: number, high: number) {
	return low + Math.floor(Math.random() * (high - low + 1));
}

export function randomFloat(low: number, high: number) {
	return low + Math.random() * (high - low);
}

export function randFloatSpread(range: number) {
	return range * (0.5 - Math.random());
}

export function degToRad(degrees: number) {
	return degrees * DEG2RAD;
}

export function radToDeg(radians: number) {
	return radians * RAD2DEG;
}

export function isPowerOfTwo(value: number) {
	return (value & (value - 1)) === 0 && value !== 0;
}

export function ceilPowerOfTwo(value: number) {
	return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

export function floorPowerOfTwo(value: number) {
	return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}