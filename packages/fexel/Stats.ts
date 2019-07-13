import { mapLinear } from './math/util';

interface Graph {
	label: string;
	buffer: number[];
	color: string;
	min: number;
	max: number;
}

const LABEL_HEIGHT = 10;
const LABEL_PADDING = 2;

export class Stats {
	public readonly canvas: HTMLCanvasElement;
	protected ctx: CanvasRenderingContext2D;
	protected graph: Graph[] = [];
	protected selected: number = 0;

	constructor(width = 200, height = 100) {
		this.canvas = document.createElement('canvas');
		this.canvas.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:90000';
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
		this.ctx.fillStyle = '#000';
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
		// this.graph.sort((a, b) => a.order - b.order);
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

		const graph = this.graph[this.selected];
		const graphY = LABEL_HEIGHT + LABEL_PADDING * 2;
		const graphHeight = height - graphY;

		const value = Math.max(...graph.buffer);
		const newMin = Math.min(graph.min, value);
		const newMax = Math.max(graph.max, value);

		const h = 1 - mapLinear(newMin - (newMax - newMin) * 0.1, newMax + (newMax - newMin) * 0.1, 0, 1, value) || -1;
		const label = `${strPadRight(value.toString(), 6)} ${graph.label} (${newMin}-${newMax})`;

		ctx.globalAlpha = 1;
		ctx.drawImage(canvas, 1, graphY, width - 1, graphHeight, 0, graphY, width - 1, graphHeight);
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, width, graphY);
		ctx.fillRect(width - 1, graphY, 1, graphHeight);

		ctx.globalAlpha = 1;
		ctx.fillStyle = graph.color;
		ctx.fillText(label, LABEL_PADDING, LABEL_PADDING);

		// Plot
		ctx.fillStyle = graph.color;
		ctx.globalAlpha = 1;
		ctx.fillRect(width - 1, graphY + Math.round(h * graphHeight), 1, 1);
		ctx.globalAlpha = 0.5;
		ctx.fillRect(width - 1, graphY + Math.round(h * graphHeight) + 1, 1, graphHeight - 1 - Math.round(h * graphHeight));

		graph.buffer.splice(0, graph.buffer.length);
		graph.min = newMin;
		graph.max = newMax;
	}
}

function strPadRight(str: string, length: number, pad = ' ') {
	for (; str.length <= length; str = pad + str);
	return str;
}
