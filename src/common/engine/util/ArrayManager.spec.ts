import 'mocha';
import { use, expect, should } from 'chai';
should();
import { ArrayManager, TypedArrayManager, TypedArrayVariableManager, ArrayVariableManager, ArrayBlock } from './ArrayManager';


describe('Storage', () => {

	it('construct', async () => {

		expect(() => {
			return new TypedArrayManager(new Float32Array(1));
		}).to.not.throw();

		expect(() => {
			return new TypedArrayManager(new Float32Array(0));
		}).to.not.throw();

		expect(() => {
			return new TypedArrayVariableManager(new Float32Array(1), 1);
		}).to.not.throw();

		expect(() => {
			return new TypedArrayVariableManager(new Float32Array(0), 1);
		}).to.not.throw();

		expect(() => {
			return new TypedArrayVariableManager(new Float32Array(1), 0);
		}).to.throw();

		expect(Array.from(new TypedArrayManager(new Float32Array(2)).data)).to.eql([0, 0]);

		expect(Array.from(new TypedArrayVariableManager(new Float32Array(0), 2).data)).to.eql([]);

		const s2 = new PointMeshManager({
			sizes: new Float32Array(0),
			positions: new Float32Array(0),
			colors: new Float32Array(0),
		}, 0, 1);

		expect(Array.from(s2.data.sizes)).to.eql([]);
		expect(Array.from(s2.data.positions)).to.eql([]);
		expect(Array.from(s2.data.colors)).to.eql([]);

	});

	it('alloc', async () => {
		const m1 = new TypedArrayManager(new Uint8Array(10));
		m1.alloc([1, 2]);
		m1.alloc([3, 4]);
		m1.alloc([5, 6]);
		expect(Array.from(m1.data)).to.eql([1, 2, 3, 4, 5, 6, 0, 0, 0, 0]);

		const m2 = new TypedArrayVariableManager(new Uint8Array(0), 2);
		m2.alloc([1, 2]);
		m2.alloc([3, 4]);
		m2.alloc([5, 6]);
		expect(Array.from(m2.data)).to.eql([1, 2, 3, 4, 5, 6]);

		const m3 = new PointMeshManager({
			sizes: new Float32Array(0),
			positions: new Float32Array(0),
			colors: new Float32Array(0),
		}, 0, 2);

		m3.alloc(1);
		expect(Array.from(m3.data.sizes)).to.eql([0, 0]);
		expect(Array.from(m3.data.positions)).to.eql([0, 0, 0, 0, 0, 0]);
		expect(Array.from(m3.data.colors)).to.eql([0, 0, 0, 0, 0, 0, 0, 0]);
	});

	it('free', async () => {
		const m1 = new TypedArrayManager(new Uint8Array(10));
		m1.alloc([1, 2]);
		const b1 = m1.alloc([3, 4]);
		const b2 = m1.alloc([5, 6]);
		m1.alloc([7, 8]);
		expect(m1.head.right).to.equal(b1);
		expect(m1.head.right!.right).to.equal(b2);
		
		m1.free(b1);
		expect(b1.freed).to.equal(true);

		m1.free(b2);
		expect(m1.head.right).to.equal(b1);

		m1.alloc([9, 10, 11]);
		expect(Array.from(m1.data)).to.eql([1, 2, 9, 10, 11, 6, 7, 8, 0, 0]);
	});

	it('defrag', async () => {
		const m1 = new TypedArrayManager(new Uint8Array(10));
		m1.alloc([1, 2]);
		const b1 = m1.alloc([3, 4]);
		const b2 = m1.alloc([5, 6]);
		m1.alloc([7, 8]);
		m1.free(b1);
		m1.free(b2);
		m1.defrag();
		expect(Array.from(m1.data)).to.eql([1, 2, 7, 8, 5, 6, 7, 8, 0, 0]);
		m1.alloc([9, 10, 11]);
		expect(Array.from(m1.data)).to.eql([1, 2, 7, 8, 9, 10, 11, 8, 0, 0]);
	});

	it('shrink', async () => {
		const m1 = new TypedArrayVariableManager(new Uint8Array(10), 2);
		m1.alloc([1, 2]);
		const b1 = m1.alloc([3, 4]);
		const b2 = m1.alloc([5, 6]);
		m1.alloc([7, 8]);
		m1.free(b1);
		m1.free(b2);
		m1.defrag();
		m1.shrink();
		expect(Array.from(m1.data)).to.eql([1, 2, 7, 8]);
	});

});

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

class PointMeshManager extends ArrayVariableManager<DataStruct, DataItem> {
	resize(data: DataStruct, size: number): DataStruct {
		data.sizes = resizeFloat32Array(data.sizes, size * 1);
		data.positions = resizeFloat32Array(data.positions, size * 3);
		data.colors = resizeFloat32Array(data.colors, size * 4);
		return data;
	}

	move(data: DataStruct, block: ArrayBlock, offset: number) {
		data.sizes.copyWithin(offset * 1, block.offset * 1, block.offset * 1 + block.size * 1);
		data.positions.copyWithin(offset * 3, block.offset * 3, block.offset * 3 + block.size * 3);
		data.colors.copyWithin(offset * 4, block.offset * 4, block.offset * 4 + block.size * 4);
	}

	set(data: DataStruct, index: number, value: DataItem) {
		data.sizes[index * 1 + 0] = value.size;
		data.positions[index * 3 + 0] = value.positions[0];
		data.positions[index * 3 + 1] = value.positions[1];
		data.positions[index * 3 + 2] = value.positions[2];
		data.colors[index * 4 + 0] = value.colors[0];
		data.colors[index * 4 + 1] = value.colors[1];
		data.colors[index * 4 + 2] = value.colors[2];
		data.colors[index * 4 + 3] = value.colors[3];
	}

	get(data: DataStruct, index: number): DataItem {
		return {
			size: data.sizes[index * 1 + 0],
			positions: [data.positions[index * 3 + 0], data.positions[index * 3 + 1], data.positions[index * 3 + 2]],
			colors: [data.colors[index * 4 + 0], data.colors[index * 4 + 1], data.colors[index * 4 + 2], data.colors[index * 4 + 3]]
		};
	}
}

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