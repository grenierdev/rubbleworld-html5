import { mapLinear } from './math/util';

interface Graph {
	label: string;
	value?: number;
	lastValue?: number;
	color: string;
	min: number;
	max: number;
}

const BG = 'rgba(23, 40, 91, 1.0)';
const BGA = 'rgba(23, 40, 91, 0.0)';
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 12;
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
	public readonly graphCanvas: HTMLCanvasElement;
	protected graphCtx: CanvasRenderingContext2D;
	public readonly labelCanvas: HTMLCanvasElement;
	protected labelCtx: CanvasRenderingContext2D;
	protected labelBG: CanvasGradient;
	protected graph: Map<string, Graph> = new Map();
	protected hPlotted: Set<number> = new Set();

	constructor(width = 200, height = 100) {
		this.graphCanvas = document.createElement('canvas');
		this.graphCanvas.style.cssText = 'position:fixed;top:0;left:0;opacity:1.0;z-index:90000';
		this.graphCanvas.width = width;
		this.graphCanvas.height = height;

		this.labelCanvas = document.createElement('canvas');
		this.labelCanvas.style.cssText = 'position:fixed;top:0;left:0;opacity:1.0;z-index:90001';
		this.labelCanvas.width = LABEL_WIDTH;
		this.labelCanvas.height = height;

		this.graphCtx = this.graphCanvas.getContext('2d')!;
		this.graphCtx.textBaseline = 'top';
		this.graphCtx.globalAlpha = 1.0;
		this.graphCtx.fillStyle = BG;
		this.graphCtx.fillRect(0, 0, width, height);

		this.labelCtx = this.labelCanvas.getContext('2d')!;
		this.labelCtx.font = '12px monospace';
		this.labelCtx.textBaseline = 'top';

		this.labelBG = this.labelCtx.createLinearGradient(LABEL_WIDTH - 20, 0, LABEL_WIDTH, 0);
		this.labelBG.addColorStop(0.0, BG);
		this.labelBG.addColorStop(1.0, BGA);
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
			graphCtx,
			graphCanvas,
			graphCanvas: { width, height },
			labelCtx,
		} = this;

		const graphX = 0;
		const graphW = width - graphX;
		const graphY = 0;
		const graphH = height - graphY;

		// Reset style
		graphCtx.globalAlpha = 1;
		graphCtx.fillStyle = BG;

		// Move graph to the left
		graphCtx.drawImage(graphCanvas, graphX + 1, graphY, graphW - 1, graphH, graphX, graphY, graphW - 1, graphH);

		// Clear out last line
		graphCtx.fillRect(graphX + graphW - 1, graphY, 1, graphH);

		this.hPlotted.clear();
		const l = this.graph.size;

		// Draw graph
		for (const [, graph] of this.graph) {
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

				graphCtx.fillStyle = graph.color;
				graphCtx.globalAlpha = 1;
				graphCtx.fillRect(graphX + graphW - 1, graphY + h, 1, 1);
				graphCtx.globalAlpha = 0.5 / l;
				graphCtx.fillRect(graphX + graphW - 1, graphY + h + 1, 1, graphH - 1 - h);

				graph.value = undefined;
				graph.lastValue = value;
				graph.min = newMin;
				graph.max = newMax;

				this.hPlotted.add(h);
			}
		}

		// Clear out previous labels
		labelCtx.clearRect(0, 0, LABEL_WIDTH, height);
		labelCtx.globalAlpha = 0.5;
		labelCtx.fillStyle = this.labelBG;
		labelCtx.fillRect(0, 0, LABEL_WIDTH, height);

		labelCtx.globalAlpha = 1.0;

		// Draw labels
		let i = -1;
		for (const [, graph] of this.graph) {
			if (graph.value !== undefined || graph.lastValue !== undefined) {
				++i;
				const value = graph.value !== undefined ? graph.value : graph.lastValue!;

				let label = strPadRight(Math.round(value).toString(), 4);
				label += graph.label;
				label += ` (${Math.round(graph.min)}`;
				label += `-${Math.round(graph.max)})`;

				labelCtx.fillStyle = graph.color;
				labelCtx.fillText(label, 0, (i + 1) * LABEL_PADDING + i * LABEL_HEIGHT);
			}
		}
	}
}

function strPadRight(str: string, length: number, pad = ' ') {
	for (; str.length <= length; str = pad + str);
	return str;
}
