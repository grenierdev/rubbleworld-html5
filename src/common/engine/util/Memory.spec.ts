import 'mocha';
import { use, expect, should } from 'chai';
should();
import { MemoryAddress } from './Memory';

describe('Memory', () => {

	it('construct', async () => {
		expect(Array.from(new MemoryAddress(0, 2).buffer)).to.eql([]);
		expect(Array.from(new MemoryAddress(1, 2).buffer)).to.eql([0, 0]);
		expect(Array.from(new MemoryAddress(2, 2).buffer)).to.eql([0, 0]);
		expect(Array.from(new MemoryAddress(3, 2).buffer)).to.eql([0, 0, 0, 0]);
		expect(Array.from(new MemoryAddress(4, 2).buffer)).to.eql([0, 0, 0, 0]);
		expect(Array.from(new MemoryAddress(5, 2).buffer)).to.eql([0, 0, 0, 0, 0, 0]);

		expect(new MemoryAddress(0, 2).buffer).to.be.an.instanceOf(Uint8Array);
		expect(new MemoryAddress(0, 2, Uint8Array).buffer).to.be.an.instanceOf(Uint8Array);
		expect(new MemoryAddress(0, 2, Uint16Array).buffer).to.be.an.instanceOf(Uint16Array);
		expect(new MemoryAddress(0, 2, Uint32Array).buffer).to.be.an.instanceOf(Uint32Array);
		expect(new MemoryAddress(0, 2, Float32Array).buffer).to.be.an.instanceOf(Float32Array);
		expect(new MemoryAddress(0, 2, Int8Array).buffer).to.be.an.instanceOf(Int8Array);
		expect(new MemoryAddress(0, 2, Int16Array).buffer).to.be.an.instanceOf(Int16Array);
		expect(new MemoryAddress(0, 2, Int32Array).buffer).to.be.an.instanceOf(Int32Array);
	});

	it('alloc', async () => {
		const mem = new MemoryAddress(10, 10);

		const b1 = mem.alloc([1, 2]);
		expect(mem.head).to.equal(b1);
		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(mem.tail);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 0, 0, 0, 0, 0, 0, 0, 0]);
		const b2 = mem.alloc([3, 4]);
		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(b2);
		expect(b2.left).to.equal(b1);
		expect(b2.right).to.equal(mem.tail);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 3, 4, 0, 0, 0, 0, 0, 0]);
		const b3 = mem.alloc([5, 6]);
		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(b2);
		expect(b2.left).to.equal(b1);
		expect(b2.right).to.equal(b3);
		expect(b3.left).to.equal(b2);
		expect(b3.right).to.equal(mem.tail);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 3, 4, 5, 6, 0, 0, 0, 0]);
	});

	it('free', async () => {
		const mem = new MemoryAddress(10, 10);

		const b1 = mem.alloc([1, 2]);
		const b2 = mem.alloc([3, 4]);
		const b3 = mem.alloc([5, 6]);
		const b4 = mem.alloc([7, 8]);

		mem.free(b2);

		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(b2);
		expect(b2.left).to.equal(b1);
		expect(b2.right).to.equal(b3);
		expect(b3.left).to.equal(b2);
		expect(b3.right).to.equal(b4);
		expect(b4.left).to.equal(b3);
		expect(b4.right).to.equal(mem.tail);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 0, 0]);

		mem.free(b3);

		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(b2);
		expect(b2.left).to.equal(b1);
		expect(b2.right).to.equal(b4);
		// expect(b3.left).to.equal(b2);
		// expect(b3.right).to.equal(b4);
		expect(b4.left).to.equal(b2);
		expect(b4.right).to.equal(mem.tail);

		
		const b5 = mem.alloc([9, 10, 11]);

		expect(b1.left).to.equal(undefined);
		expect(b1.right).to.equal(b5);
		expect(b5.left).to.equal(b1);
		expect(b5.right).to.equal(b2);
		expect(b2.left).to.equal(b5);
		expect(b2.right).to.equal(b4);
		expect(b4.left).to.equal(b2);
		expect(b4.right).to.equal(mem.tail);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 9, 10, 11, 6, 7, 8, 0, 0]);
	});

	it('grow', async () => {
		const mem = new MemoryAddress(0, 2);

		expect(Array.from(mem.buffer)).to.eql([]);

		const b1 = mem.alloc([1, 2]);

		expect(Array.from(mem.buffer)).to.eql([1, 2]);
		expect(mem.tail.freed).to.equal(false);

		const b2 = mem.alloc([3, 4]);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 3, 4]);
		expect(mem.tail.freed).to.equal(false);
	});

	it('defrag', async () => {
		const mem = new MemoryAddress(10, 10);
		const b1 = mem.alloc([1, 2]);
		const b2 = mem.alloc([3, 4]);
		const b3 = mem.alloc([5, 6]);
		const b4 = mem.alloc([7, 8]);
		mem.free(b2);
		mem.free(b3);
		const b5 = mem.alloc([9, 10]);

		expect(Array.from(mem.buffer)).to.eql([1, 2, 9, 10, 5, 6, 7, 8, 0, 0]);

		mem.defrag();

		expect(Array.from(mem.buffer)).to.eql([1, 2, 9, 10, 7, 8, 7, 8, 0, 0]);
	});

	it('shrink', async () => {
		const mem = new MemoryAddress(10, 2);

		const b1 = mem.alloc([1, 2]);
		expect(Array.from(mem.buffer)).to.eql([1, 2, 0, 0, 0, 0, 0, 0, 0, 0]);

		mem.shrink();

		expect(Array.from(mem.buffer)).to.eql([1, 2]);
	});

});