import { mapLinear } from './math/util';

interface Graph {
	label: string;
	buffer: number[];
	color: string;
	min: number;
	max: number;
}

const BG = '#17285b';
const LABEL_WIDTH = 80;
const LABEL_HEIGHT = 10;
const LABEL_PADDING = 2;

export class Stats {
	public readonly canvas: HTMLCanvasElement;
	protected ctx: CanvasRenderingContext2D;
	protected graph: Graph[] = [];
	protected selected: number = 0;

	constructor(width = 200, height = 100) {
		this.canvas = document.createElement('canvas');
		this.canvas.style.cssText = 'position:fixed;top:0;left:0;opacity:1.0;z-index:90000';
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.addEventListener('click', e => {
			e.preventDefault();
			this.selected = ++this.selected % this.graph.length;
		});

		this.ctx = this.canvas.getContext('2d')!;
		this.ctx.font = 'bold 9px Helvetica,Arial,sans-serif';
		this.ctx.textBaseline = 'top';
		this.ctx.globalAlpha = 0.9;
		this.ctx.fillStyle = BG;
		this.ctx.fillRect(0, 0, width, height);
	}

	addGraph({
		label,
		color,
		min = Number.MAX_VALUE,
		max = Number.MIN_VALUE,
	}: Pick<Graph, 'label' | 'color'> & { min?: number; max?: number }) {
		const buffer: number[] = [];
		this.graph.push({
			label,
			color,
			buffer,
			min,
			max,
		});
		return value => {
			buffer.push(value);
		};
	}

	update() {
		const {
			ctx,
			canvas,
			canvas: { width, height },
		} = this;

		const cols = Math.ceil(width / LABEL_WIDTH);
		const rows = Math.ceil(this.graph.length / cols);

		const graphY = (LABEL_HEIGHT + LABEL_PADDING) * rows + LABEL_PADDING;
		const graphH = height - graphY;

		// Clear out label area
		ctx.globalAlpha = 1;
		ctx.fillStyle = BG;
		ctx.fillRect(0, 0, width, graphY);

		// Move graph to the left
		ctx.drawImage(canvas, 1, graphY, width - 1, graphH, 0, graphY, width - 1, graphH);

		// Clear out last line
		ctx.fillRect(width - 1, graphY, 1, graphH);

		for (let i = 0, l = this.graph.length, r = 0; i < l && r < rows; ++r) {
			for (let c = 0; i < l && c < cols; ++c, ++i) {
				const graph = this.graph[i];

				const value = Math.max(...graph.buffer);
				let newMin = Math.min(graph.min, value);
				if (!isFinite(newMin)) {
					newMin = graph.min;
				}
				let newMax = Math.max(graph.max, value);
				if (!isFinite(newMax)) {
					newMax = graph.max;
				}

				const p = 1 - mapLinear(newMin - (newMax - newMin) * 0.1, newMax + (newMax - newMin) * 0.1, 0, 1, value) || -1;
				const h = Math.round(p * graphH);
				const label = `${strPadRight(value.toString(), 6)} ${graph.label} (${newMin}-${newMax})`;

				ctx.globalAlpha = 1;
				ctx.fillStyle = graph.color;
				ctx.fillText(label, (c + 1) * LABEL_PADDING + c * LABEL_WIDTH, (r + 1) * LABEL_PADDING + r * LABEL_HEIGHT);

				ctx.fillRect(width - 1, graphY + h, 1, 1);
				ctx.globalAlpha = 0.5 / l;
				ctx.fillRect(width - 1, graphY + h + 1, 1, graphH - 1 - h);

				graph.buffer.splice(0, graph.buffer.length);
				graph.min = newMin;
				graph.max = newMax;
			}
		}

		// const graph = this.graph[this.selected];
		// const graphY = LABEL_HEIGHT + LABEL_PADDING * 2;
		// const graphHeight = height - graphY;

		// const value = Math.max(...graph.buffer);
		// const newMin = Math.min(graph.min, value);
		// const newMax = Math.max(graph.max, value);

		// const h = 1 - mapLinear(newMin - (newMax - newMin) * 0.1, newMax + (newMax - newMin) * 0.1, 0, 1, value) || -1;
		// const label = `${strPadRight(value.toString(), 6)} ${graph.label} (${newMin}-${newMax})`;

		// ctx.globalAlpha = 1;
		// ctx.drawImage(canvas, 1, graphY, width - 1, graphHeight, 0, graphY, width - 1, graphHeight);
		// ctx.globalAlpha = 0.9;
		// ctx.fillStyle = BG;
		// ctx.fillRect(0, 0, width, graphY);
		// ctx.fillRect(width - 1, graphY, 1, graphHeight);

		// ctx.globalAlpha = 1;
		// ctx.fillStyle = graph.color;
		// ctx.fillText(label, LABEL_PADDING, LABEL_PADDING);

		// // Plot
		// ctx.fillStyle = graph.color;
		// ctx.globalAlpha = 1;
		// ctx.fillRect(width - 1, graphY + Math.round(h * graphHeight), 1, 1);
		// ctx.globalAlpha = 0.5;
		// ctx.fillRect(width - 1, graphY + Math.round(h * graphHeight) + 1, 1, graphHeight - 1 - Math.round(h * graphHeight));

		// graph.buffer.splice(0, graph.buffer.length);
		// graph.min = newMin;
		// graph.max = newMax;
	}
}

function strPadRight(str: string, length: number, pad = ' ') {
	for (; str.length <= length; str = pad + str);
	return str;
}
