import { mapLinear } from './math/util';

interface Graph {
	label: string;
	buffer: number[];
	color: string;
	order: number;
	min: number;
	max: number;
}

const PR = Math.round(window.devicePixelRatio || 1);
const WIDTH = 400;
const HEIGHT = 10;
const GRAPH_WIDTH = 270;
const GRAPH_X = WIDTH - GRAPH_WIDTH;

export class Stats {
	public readonly canvas: HTMLCanvasElement;
	protected ctx: CanvasRenderingContext2D;
	protected graph: Graph[] = [];

	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:90000';
		this.canvas.width = WIDTH * PR;

		this.ctx = this.canvas.getContext('2d')!;
	}

	addGraph({ label, color, order = 0 }: Pick<Graph, 'label' | 'color'> & { order?: number }) {
		const buffer: number[] = [];
		this.graph.push({
			label,
			order,
			color,
			buffer,
			min: Number.MAX_VALUE,
			max: Number.MIN_VALUE,
		});
		this.graph.sort((a, b) => a.order - b.order);
		this.canvas.height = HEIGHT * PR * this.graph.length;
		return value => {
			buffer.push(value);
		};
	}

	update() {
		this.ctx.font = 'bold ' + HEIGHT * PR + 'px monospace';
		this.ctx.textBaseline = 'top';

		this.ctx.clearRect(0, 0, GRAPH_X, this.canvas.height);
		for (let i = 0, l = this.graph.length; i < l; ++i) {
			const graph = this.graph[i];

			const value = Math.max(...graph.buffer);
			const newMin = Math.min(graph.min, value);
			const newMax = Math.max(graph.max, value);

			const h = 1 - mapLinear(newMin, newMax, 0, 1, value) || 0;
			const label = `${strPadRight(value.toString(), 6)} ${graph.label} (${newMin}-${newMax})`;

			this.ctx.fillStyle = graph.color;
			this.ctx.fillText(label, 0, i * HEIGHT * PR);

			this.ctx.drawImage(
				this.canvas,
				GRAPH_X + 1,
				i * HEIGHT,
				GRAPH_WIDTH - 1,
				HEIGHT,
				GRAPH_X,
				i * HEIGHT,
				GRAPH_WIDTH - 1,
				HEIGHT
			);

			this.ctx.fillRect(WIDTH - PR, i * HEIGHT * PR, PR, HEIGHT * PR);

			this.ctx.clearRect(WIDTH - PR, i * HEIGHT * PR, PR, Math.round(h * HEIGHT));

			graph.buffer.splice(0, graph.buffer.length);
			graph.min = newMin;
			graph.max = newMax;
		}
	}
}

function strPadRight(str: string, length: number, pad = ' ') {
	for (; str.length < length; str = pad + str);
	return str;
}
