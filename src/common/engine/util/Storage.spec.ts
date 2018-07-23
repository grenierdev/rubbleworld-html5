import 'mocha';
import { use, expect, should } from 'chai';
should();
import { Storage, Block } from './Storage';


describe('Storage', () => {

	it('construct', async () => {

		expect(() => {
			return new Storage({}, {
				size: 10,
				move(block, offset) { }
			});
		}).to.not.throw();

		expect(() => {
			return new Storage({}, {
				size: 0,
				move(block, offset) { }
			});
		}).to.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 10,
				resize(data, size) { return data; },
				move(block, offset, data) { }
			});
		}).to.not.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 0,
				resize(data, size) { return data; },
				move(block, offset, data) { }
			});
		}).to.throw();

		expect(() => {
			return new Storage({}, {
				initialSize: 0,
				growSize: 10,
				// resize(data, size) { },
				move(block, offset) { }
			} as any);
		}).to.throw();

		const s1 = new Storage(new Float32Array(0), {
			initialSize: 4,
			growSize: 4,
			resize: resizeFloat32Array,
			move(block, offset, data) {
				data.copyWithin(offset, block.offset, block.size);
			}
		});

		expect(Array.from(s1.data)).to.eql([0, 0, 0, 0]);

		const s2 = new Storage(
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
			move(block, offset, data) {
				data.sizes.copyWithin(offset * 1, block.offset * 1, block.size * 1);
				data.positions.copyWithin(offset * 3, block.offset * 3, block.size * 3);
				data.colors.copyWithin(offset * 4, block.offset * 4, block.size * 4);
			}
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