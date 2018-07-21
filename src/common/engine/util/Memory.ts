import { Mutable } from "./Mutable";

export interface MemoryArray<T> {
	readonly length: number;
	[index: number]: T;
	set(array: ArrayLike<number>, offset?: number): void;
	copyWithin(target: number, start: number, end?: number): this;
	slice(start?: number, end?: number): MemoryArray<T>;
}

export interface MemoryArrayConstructor<T> {
	readonly prototype: MemoryArray<T>;
	new(length: number): MemoryArray<T>;
	new(arrayOrArrayBuffer: ArrayLike<number> | ArrayBufferLike): MemoryArray<T>;
	new(buffer: ArrayBufferLike, byteOffset: number, length?: number): MemoryArray<T>;
}

export class MemoryAddress<T extends MemoryArray<number> = Uint8Array> {

	public readonly buffer: T;
	public readonly head: MemoryBlock<T>;
	public readonly tail: MemoryBlock<T>;

	constructor(
		public readonly initialSize = 0,
		public readonly growSize = 1,
		public readonly typedArrayConstructor: MemoryArrayConstructor<number> = Uint8Array
	) {
		this.buffer = new typedArrayConstructor(Math.ceil(initialSize / growSize) * growSize) as T;
		this.head = new MemoryBlock(this, true, 0, this.buffer.length);
		this.tail = this.head;
	}

	alloc(size: number, values?: number[]): MemoryBlock<T> {
		let newBlock: MemoryBlock<T> | undefined;

		for (
			let block: MemoryBlock<T> | undefined = this.head;
			block !== undefined;
			block = block.right
		) {
			if (block.freed) {
				if (block.length === size) {
					newBlock = block;
					(newBlock as Mutable<MemoryBlock<T>>).freed = false;
					break;
				}
				else if (block.length > size) {
					newBlock = split(block, size, false);
					break;
				}
			}
		}

		// Grow memory address if no more free space
		if (newBlock === undefined) {
			const newLength = this.buffer.length + Math.ceil(size / this.growSize) * this.growSize;
			const newBuffer = new this.typedArrayConstructor(newLength) as T;
			newBuffer.set(this.buffer, 0);
			
			if (this.tail.freed === false) {
				const newOffset = this.tail.offset + this.tail.length;
				const newTail = new MemoryBlock(this, true, newOffset, newLength - newOffset, this.tail);
				(this.tail as Mutable<MemoryBlock<T>>).right = newTail;
				(this as Mutable<MemoryAddress<T>>).tail = newTail;
			} else {
				(this.tail as Mutable<MemoryBlock<T>>).resizeWindow(this.tail.length + newLength - this.buffer.length);
			}

			(this as Mutable<MemoryAddress<T>>).buffer = newBuffer;

			return this.alloc(size, values);
		}

		if (values) {
			newBlock!.set(...values);
		}
		return newBlock!;
	}

	free(block: MemoryBlock<T>) {
		if (block.freed === false) {
			(block as Mutable<MemoryBlock<T>>).freed = true;

			let destroyBlock = false;

			if (block.left && block.left.freed) {
				(block.left as Mutable<MemoryBlock<T>>).resizeWindow(block.left.length + block.length);
				(block.left as Mutable<MemoryBlock<T>>).right = block.right;
				if (block.right) {
					(block.right as Mutable<MemoryBlock<T>>).left = block.left;
				}
				destroyBlock = true;
			}
			
			if (block.right && block.right.freed) {
				(block.right as Mutable<MemoryBlock<T>>).offset = block.offset;
				(block.right as Mutable<MemoryBlock<T>>).resizeWindow(block.right.length + block.length);
				(block.right as Mutable<MemoryBlock<T>>).left = block.left;
				if (block.left) {
					(block.left as Mutable<MemoryBlock<T>>).right = block.right;
				}
				destroyBlock = true;
			}

			// Destroy block
			if (destroyBlock) {
				destroy(block);
			}
		}
	}

	defrag() {
		let block: MemoryBlock<T> | undefined = this.head;
		let left: MemoryBlock<T> | undefined;
		let offset = 0;
		while (block !== undefined) {
			if (block.freed === false) {
				this.buffer.copyWithin(offset, block.offset, block.offset + block.length);
				(block as Mutable<MemoryBlock<T>>).offset = offset;
				offset += block.length;

				if (left) {
					(left as Mutable<MemoryBlock<T>>).right = block;
					(block as Mutable<MemoryBlock<T>>).left = left;
				} else {
					(block as Mutable<MemoryBlock<T>>).left = undefined;
				}

				left = block;

				block = block.right;
			} else {
				const right = block.right;
				destroy(block);

				block = right;
			}
		}

		if (left && left.offset + left.length !== this.buffer.length) {
			const newTail = new MemoryBlock(this, true, left.offset + left.length, this.buffer.length - (left.offset + left.length), left);
			(left as Mutable<MemoryBlock<T>>).right = newTail;
			(this as Mutable<MemoryAddress<T>>).tail = newTail;
		}
	}

	shrink() {
		this.defrag();
		if (this.tail.freed) {
			if (this.tail.left) {
				const newLength = Math.ceil(this.tail.offset / this.growSize) * this.growSize;
				const newBuffer = this.buffer.slice(0, newLength) as T;

				(this as Mutable<MemoryAddress<T>>).tail = this.tail.left;
				(this as Mutable<MemoryAddress<T>>).buffer = newBuffer;
			} else {
				(this as Mutable<MemoryAddress<T>>).buffer = new this.typedArrayConstructor(0) as  T;
				this.tail.resizeWindow(0);
			}
		}
	}
}

interface Chain<T> {
	left?: T
	right?: T
}

export class MemoryBlock<T extends MemoryArray<number>> implements Chain<MemoryBlock<T>> {
	[index: number]: number;

	constructor(
		public memory: MemoryAddress<any>,
		public freed: boolean,
		public offset: number,
		public length: number,
		public left?: MemoryBlock<T>,
		public right?: MemoryBlock<T>
	) {
		this.resizeWindow(length);
	}

	resizeWindow(length: number) {
		const memory = this.memory;
		for (let i = 0; i < length; ++i) {
			if (Object.getOwnPropertyDescriptor(this, i) === undefined) {
				Object.defineProperty(this, i, {
					enumerable: true,
					get() {
						return memory.buffer[this.offset + i];
					},
					set(v: any) {
						memory.buffer[this.offset + i] = v;
					}
				});
			}
		}
		(this as Mutable<MemoryBlock<T>>).length = length;
	}

	set(...values: number[]) {
		for (let i = 0, l = values.length; i < l; ++i) {
			this[i] = values[i];
		}
	}
}

function destroy(block: MemoryBlock<any>) {
	(block as any).memory = undefined;
	(block as any).offset = undefined;
	(block as any).length = undefined;
	(block as any).left = undefined;
	(block as any).right = undefined;
}

function split(block: MemoryBlock<any>, size: number, freed = block.freed): MemoryBlock<any> {
	if (size > block.length) {
		throw new RangeError(`Memory block not big enough to split into ${size}.`);
	}

	const left = new MemoryBlock(block.memory, freed, block.offset, size, block.left, block);

	if (block.left) {
		(block.left as Mutable<MemoryBlock<any>>).right = left;
	}

	(block as Mutable<MemoryBlock<any>>).offset += size;
	(block as Mutable<MemoryBlock<any>>).resizeWindow(block.length - size);
	(block as Mutable<MemoryBlock<any>>).left = left;

	if (block.memory.head === block) {
		(block.memory as Mutable<MemoryAddress<any>>).head = left;
	}

	return left;
}