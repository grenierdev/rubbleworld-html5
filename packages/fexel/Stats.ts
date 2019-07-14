import { mapLinear } from './math/util';

interface Graph {
	label: string;
	value?: number;
	lastValue?: number;
	color: string;
	min: number;
	max: number;
}

const BG = '#17285b';
const LABEL_WIDTH = 80;
const LABEL_HEIGHT = 10;
const LABEL_PADDING = 2;
const COLORS = [
	'#EB2D2D',
	'#6CFF5B',
	'#3EB7EF',
	'#C750FF',
	'#CB6B9B',
	'#FFE52A',
	'#FFBB3D',
	'#C7FF35',
	'#3AFFDB',
	'#57FF9A',
	'#FF8717',
	'#FF6434',
];

export class Stats {
	public readonly canvas: HTMLCanvasElement;
	protected ctx: CanvasRenderingContext2D;
	protected graph: Map<string, Graph> = new Map();
	protected hPlotted: Set<number> = new Set();

	constructor(width = 200, height = 100) {
		this.canvas = document.createElement('canvas');
		this.canvas.style.cssText = 'position:fixed;top:0;left:0;opacity:1.0;z-index:90000';
		this.canvas.width = width;
		this.canvas.height = height;

		this.ctx = this.canvas.getContext('2d')!;
		this.ctx.font = 'bold 9px Helvetica,Arial,sans-serif';
		this.ctx.textBaseline = 'top';
		this.ctx.globalAlpha = 0.9;
		this.ctx.fillStyle = BG;
		this.ctx.fillRect(0, 0, width, height);
	}

	addGraph({
		id,
		label,
		color,
		min = Number.MAX_VALUE,
		max = Number.MIN_VALUE,
	}: { id: string } & Pick<Graph, 'label'> & Partial<Pick<Graph, 'color' | 'min' | 'max'>>) {
		const graph: Graph = {
			label,
			color: color || COLORS[this.graph.size],
			value: undefined,
			min,
			max,
		};
		this.graph.set(id, graph);
	}

	updateGraph(id: string, value: number) {
		if (!this.graph.has(id)) {
			throw ReferenceError(`Graph ${id} not found.`);
		}
		const graph = this.graph.get(id)!;
		graph.value = graph.value !== undefined ? Math.max(graph.value, value) : value;
	}

	update() {
		const {
			ctx,
			canvas,
			canvas: { width, height },
		} = this;

		const cols = Math.floor(width / (LABEL_WIDTH + LABEL_PADDING));
		const rows = Math.ceil(this.graph.size / cols);

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

		this.hPlotted.clear();

		const graphs = this.graph.entries();

		for (let i = 0, l = this.graph.size, r = 0; i < l && r < rows; ++r) {
			for (let c = 0; i < l && c < cols; ++c, ++i) {
				const [, graph] = graphs.next().value!;

				if (graph.value !== undefined || graph.lastValue !== undefined) {
					const value = graph.value !== undefined ? graph.value : graph.lastValue!;
					let newMin = Math.min(graph.min, value);
					if (!isFinite(newMin)) {
						newMin = graph.min;
					}
					let newMax = Math.max(graph.max, value);
					if (!isFinite(newMax)) {
						newMax = graph.max;
					}

					const p = 1 - mapLinear(newMin, newMax, 0.02, 0.98, value) || -1;
					let h = Math.round(p * graphH);
					while (this.hPlotted.has(h)) {
						h += 1;
					}

					const label = `${strPadRight(value.toString(), 6)}${graph.label} (${newMin}-${newMax})`;

					ctx.globalAlpha = 1;
					ctx.fillStyle = graph.color;
					ctx.fillText(label, (c + 1) * LABEL_PADDING + c * LABEL_WIDTH, (r + 1) * LABEL_PADDING + r * LABEL_HEIGHT);

					ctx.fillRect(width - 1, graphY + h, 1, 1);
					ctx.globalAlpha = 0.5 / l;
					ctx.fillRect(width - 1, graphY + h + 1, 1, graphH - 1 - h);

					graph.value = undefined;
					graph.lastValue = value;
					graph.min = newMin;
					graph.max = newMax;

					this.hPlotted.add(h);
				}
			}
		}
	}
}

function strPadRight(str: string, length: number, pad = ' ') {
	for (; str.length <= length; str = pad + str);
	return str;
}
