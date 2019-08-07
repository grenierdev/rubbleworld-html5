import { Mutable } from './Immutable';
import { isArray } from 'util';

export abstract class ArrayManager<T = any, I = any> {
	public readonly head: ArrayBlock<T, I>;
	public readonly tail: ArrayBlock<T, I>;

	constructor(public readonly data: T, public readonly size: number) {
		if (size < 0) {
			throw new SyntaxError(`ArrayVariableManager can not have a size less than 0.`);
		}

		this.head = new ArrayBlock<T, I>(this, true, 0, size, undefined, undefined);
		this.tail = this.head;
	}

	alloc(size: number): ArrayBlock<T, I>;
	alloc(items: I[]): ArrayBlock<T, I>;
	alloc(arg: number | any[]): ArrayBlock<T, I> {
		const size = typeof arg === 'number' ? arg : arg.length;
		const items = isArray(arg) ? (arg as I[]) : undefined;

		let allocBlock: ArrayBlock<T, I> | undefined;

		for (let block: ArrayBlock<T, I> | undefined = this.head; block !== undefined; block = block.right) {
			if (block.freed) {
				if (block.size === size) {
					allocBlock = block;
					(allocBlock as Mutable<ArrayBlock<T, I>>).freed = false;
					break;
				} else if (block.size > size) {
					allocBlock = new ArrayBlock<T, I>(this, false, block.offset, size, block.left, block);
					if (block.left) {
						swapBlock(block.left, block.left.left, allocBlock);
					}
					swapBlock(block, allocBlock, block.right);
					(block as Mutable<ArrayBlock>).offset += size;
					(block as Mutable<ArrayBlock>).size -= size;

					if (this.head === block) {
						(this.head as Mutable<ArrayBlock>) = allocBlock;
					}
					break;
				}
			}
		}

		if (allocBlock) {
			if (items) {
				allocBlock.set(0, ...items);
			}
			return allocBlock;
		}

		throw new RangeError(
			`Manager could not find a free block. Please try to defragment or use a ArrayVariableManager object instead.`
		);
	}

	free(block: ArrayBlock<T, I>) {
		if (block.freed === false) {
			(block as Mutable<ArrayBlock<T, I>>).freed = true;

			if (block.left && block.left.freed) {
				if (block.right && block.right.freed) {
					(block.left as Mutable<ArrayBlock>).size += block.size + block.right.size;
					swapBlock(block.left, block.left.left, block.right.right);
					if (block.right.right) {
						swapBlock(block.right.right, block.left, block.right.right.right);
					}
					if (this.tail === block.right) {
						(this as Mutable<ArrayManager>).tail = block.left;
					}
					destroy(block.right);
				} else {
					(block.left as Mutable<ArrayBlock>).size += block.size;
					swapBlock(block.left, block.left.left, block.right);
					if (block.right) {
						swapBlock(block.right, block.left, block.right.right);
					}
				}
				destroy(block);
			} else if (block.right && block.right.freed) {
				(block as Mutable<ArrayBlock>).size += block.right.size;
				const right = block.right;
				if (right.right) {
					swapBlock(right.right, block, right.right.right);
				}
				swapBlock(block, block.left, right.right);
				destroy(right);
			}
		}
	}

	defrag() {
		if (this.tail.offset === 0) {
			return;
		}

		let block: ArrayBlock<T, I> | undefined = this.head;
		let head: ArrayBlock<T, I> | undefined;
		let left: ArrayBlock<T, I> | undefined;
		let offset = 0;
		const currentSize = this.tail.offset + this.tail.size;

		while (block !== undefined) {
			if (block.freed === false) {
				if (block.offset !== offset) {
					this.move(this.data, block, offset);
					(block as Mutable<ArrayBlock>).offset = offset;
				}
				swapBlock(block, left, block.right);
				offset += block.size;

				if (left) {
					swapBlock(left, left.left, block);
				}

				left = block;
				if (head === undefined) {
					head = block;
				}
				block = block.right;
			} else {
				const right = block.right;
				destroy(block);

				block = right;
			}
		}

		if (head) {
			(this.head as Mutable<ArrayBlock>) = head;
		}

		if (left) {
			if (left.offset + left.size < currentSize) {
				const tail = new ArrayBlock<T, I>(
					this,
					true,
					left.offset + left.size,
					currentSize - (left.offset + left.size),
					left,
					undefined
				);
				swapBlock(left, left.left, tail);
				(this.tail as Mutable<ArrayBlock>) = tail;
			} else {
				swapBlock(left, left.left, undefined);
				(this.tail as Mutable<ArrayBlock>) = left;
			}
		}
	}

	abstract move(data: T, block: ArrayBlock<T, I>, offset: number): void;
	abstract set(data: T, index: number, item: I): void;
	abstract get(data: T, index: number): I;
}

export class ArrayBlock<T = any, I = any> {
	constructor(
		public readonly manager: ArrayManager<T, I>,
		public readonly freed: boolean,
		public readonly offset: number,
		public readonly size: number,
		public readonly left: ArrayBlock<T, I> | undefined,
		public readonly right: ArrayBlock<T, I> | undefined
	) {}

	free() {
		this.manager.free(this);
	}

	set(index: number, ...values: I[]) {
		const data = this.manager.data;
		const setter = this.manager.set;
		for (let i = 0, l = values.length; i < l; ++i) {
			setter(data, this.offset + index + i, values[i]);
		}
	}

	get(index: number): I {
		return this.manager.get(this.manager.data, index);
	}
}

export abstract class ArrayVariableManager<T, I> extends ArrayManager<T, I> {
	constructor(data: T, public readonly initialSize: number, public readonly growSize: number) {
		super(data, initialSize);

		if (growSize <= 0) {
			throw new SyntaxError(`ArrayVariableManager can not have a grow size of 0.`);
		}

		(this.data as T) = this.resize(this.data, Math.ceil(initialSize / growSize) * growSize);
	}

	alloc(size: number): ArrayBlock<T, I>;
	alloc(items: I[]): ArrayBlock<T, I>;
	alloc(arg: number | I[]): ArrayBlock<T, I> {
		const size = typeof arg === 'number' ? arg : arg.length;
		const items = isArray(arg) ? (arg as I[]) : undefined;

		try {
			if (items) {
				return super.alloc(items);
			}
			return super.alloc(size);
		} catch (err) {
			this.defrag();

			const currentSize = this.tail.offset + this.tail.size;
			const newSize = currentSize + Math.ceil(size / this.growSize) * this.growSize;

			(this.data as T) = this.resize(this.data, newSize);

			if (this.tail.freed) {
				(this.tail as Mutable<ArrayBlock>).size = this.tail.size + (newSize - currentSize);
			} else {
				const tail = new ArrayBlock<T, I>(this, true, currentSize, newSize - currentSize, this.tail, undefined);
				swapBlock(this.tail, this.tail.left, tail);
				(this.tail as Mutable<ArrayBlock>) = tail;
			}

			if (items) {
				return this.alloc(items);
			}
			return this.alloc(size);
		}
	}

	shrink() {
		if (this.tail.freed) {
			if (this.tail.left) {
				const newSize = Math.ceil(this.tail.offset / this.growSize) * this.growSize;
				(this.data as T) = this.resize(this.data, newSize);
			} else {
				(this.data as T) = this.resize(this.data, 0);
			}
			(this.tail as Mutable<ArrayBlock>).size = 0;
		}
	}

	abstract resize(data: T, size: number): T;
}

function swapBlock(block: ArrayBlock, newLeft: ArrayBlock | undefined, newRight: ArrayBlock | undefined) {
	(block as Mutable<ArrayBlock>).left = newLeft;
	(block as Mutable<ArrayBlock>).right = newRight;
}

function destroy(block: ArrayBlock<any>) {
	(block as any).storage = undefined;
	(block as any).offset = undefined;
	(block as any).size = undefined;
	(block as any).left = undefined;
	(block as any).right = undefined;
}

export type TypedArray =
	| Float32Array
	| Uint32Array
	| Uint16Array
	| Uint8Array
	| Int32Array
	| Int16Array
	| Int8Array
	| Uint8ClampedArray;

export class TypedArrayManager<T extends TypedArray> extends ArrayManager<T, number> {
	constructor(data: T) {
		super(data, data.length);
	}

	move(data: T, block: ArrayBlock, offset: number) {
		data.copyWithin(offset, block.offset, block.offset + block.size);
	}

	set(data: T, index: number, value: number) {
		data[index] = value;
	}

	get(data: T, index: number) {
		return data[index];
	}
}

export class TypedArrayVariableManager<T extends TypedArray> extends ArrayVariableManager<T, number> {
	constructor(data: T, growSize: number) {
		super(data, data.length, growSize);
	}

	resize(data: T, size: number): T {
		if (data.length === size) {
			return data;
		} else if (data.length > size) {
			return data.slice(0, size) as T;
		} else {
			const constructor = this.data.constructor as new (size: number) => T;
			const newData = new constructor(size);
			newData.set(data, 0);
			return newData;
		}
	}

	move(data: T, block: ArrayBlock, offset: number) {
		data.copyWithin(offset, block.offset, block.offset + block.size);
	}

	set(data: T, index: number, value: number) {
		data[index] = value;
	}

	get(data: T, index: number) {
		return data[index];
	}
}
