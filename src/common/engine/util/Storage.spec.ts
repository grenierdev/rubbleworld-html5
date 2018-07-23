import 'mocha';
import { use, expect, should } from 'chai';
should();
import { Storage, Block } from './Storage';


describe('Storage', () => {

	it('construct', async () => {

		expect(() => {
			return new Storage({}, {
				size: 10,
				move(data, block, offset) { },
				set(data, index, value) { },
				get(data, index) { },
			});
		}).to.not.throw();

		expect(() => {
			return new Storage({}, {
				size: 0,
				move(data, block, offset) { },
				set(data, index, value) { },
				get(data, index) { },
			});
		}).to.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 10,
				resize(data, size) { return data; },
				move(data, block, offset) { },
				set(data, index, value) { },
				get(data, index) { },
			});
		}).to.not.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 0,
				resize(data, size) { return data; },
				move(data, block, offset) { },
				set(data, index, value) { },
				get(data, index) { },
			});
		}).to.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 10,
				// resize(data, size) { },
				move(block, offset) { },
				set(data, index, value) { },
				get(data, index) { },
			} as any);
		}).to.throw();

		const s1 = new Storage(new Float32Array(0), {
			initialSize: 4,
			growSize: 4,
			resize: resizeFloat32Array,
			move(data, block, offset) {
				data.copyWithin(offset, block.offset, block.size);
			},
			set(data, index, value) { },
			get(data, index) { },
		});

		expect(Array.from(s1.data)).to.eql([0, 0, 0, 0]);

		interface DataStruct {
			sizes: Float32Array
			positions: Float32Array
			colors: Float32Array
		}

		interface DataItem {
			size: number
			positions: [number, number, number],
			colors: [number, number, number, number]
		}

		const s2 = new Storage<DataStruct, DataItem>(
			{
				sizes: new Float32Array(0),
				positions: new Float32Array(0),
				colors: new Float32Array(0),
			}, {
			initialSize: 2,
			growSize: 2,
			resize(data, size) {
				data.sizes = resizeFloat32Array(data.sizes, size * 1);
				data.positions = resizeFloat32Array(data.positions, size * 3);
				data.colors = resizeFloat32Array(data.colors, size * 4);
				return data;
			},
			move(data, block, offset) {
				data.sizes.copyWithin(offset * 1, block.offset * 1, block.size * 1);
				data.positions.copyWithin(offset * 3, block.offset * 3, block.size * 3);
				data.colors.copyWithin(offset * 4, block.offset * 4, block.size * 4);
			},
			set(data, index, value) {
				data.sizes[index * 1 + 0] = value.size;
				data.positions[index * 3 + 0] = value.positions[0];
				data.positions[index * 3 + 1] = value.positions[1];
				data.positions[index * 3 + 2] = value.positions[2];
				data.colors[index * 4 + 0] = value.colors[0];
				data.colors[index * 4 + 1] = value.colors[1];
				data.colors[index * 4 + 2] = value.colors[2];
				data.colors[index * 4 + 3] = value.colors[3];
			},
			get(data, index) {
				return {
					size: data.sizes[index * 1 + 0],
					positions: [data.positions[index * 3 + 0], data.positions[index * 3 + 1], data.positions[index * 3 + 2]],
					colors: [data.colors[index * 4 + 0], data.colors[index * 4 + 1], data.colors[index * 4 + 2], data.colors[index * 4 + 3]]
				};
			},
		});

		expect(Array.from(s2.data.sizes)).to.eql([0, 0]);
		expect(Array.from(s2.data.positions)).to.eql([0, 0, 0, 0, 0, 0]);
		expect(Array.from(s2.data.colors)).to.eql([0, 0, 0, 0, 0, 0, 0, 0]);

	});

});

function resizeFloat32Array(data: Float32Array, newSize: number): Float32Array {
	if (data.length === newSize) {
		return data;
	}
	else if (data.length > newSize) {
		return data.slice(newSize);
	}
	else {
		const newData = new Float32Array(newSize);
		newData.set(data, 0);
		return newData;
	}
}