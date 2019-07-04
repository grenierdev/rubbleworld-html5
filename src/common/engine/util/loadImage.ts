export const loadingImage: ImageData = new ImageData(
	new Uint8ClampedArray([255, 0, 128, 1]),
	1,
	1
);

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.src = url;
		image.onload = () => resolve(image);
		image.onerror = reject;
	});
}
