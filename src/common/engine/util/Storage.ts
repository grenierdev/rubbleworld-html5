import { Mutable } from "./Mutable";
import { isArray } from "util";

export type StorageOptions<T, I> = StorageOptionsResizable<T, I> | StorageOptionsFixed<T, I>

export interface StorageOptionsResizable<T, I> {
	initialSize?: number
	growSize: number
	resize: (data: T, size: number) => T
	move: (data: T, block: Block<T, I>, offset: number) => void
	set: (data: T, index: number, item: I) => void
	get: (data: T, index: number) => I
}

export interface StorageOptionsFixed<T, I> {
	size: number
	move: (data: T, block: Block<T, I>, offset: number) => void
	set: (data: T, index: number, item: I) => void
	get: (data: T, index: number) => I
}

function isResizableOptions(options: any): options is StorageOptionsResizable<any, any> {
	return typeof options.initialSize === 'number' && typeof options.resize === 'function';
}

function isFixedOptions(options: any): options is StorageOptionsFixed<any, any> {
	return typeof options.size !== 'undefined';
}

export class Storage<T = any, I = any> {
	protected static blockConstructor: typeof Block;

	public readonly head: Block<T, I>;
	public readonly tail: Block<T, I>;

	private autoGrow: boolean;

	constructor(
		public readonly data: T,
		public readonly options: StorageOptions<T, I>
	) {
		let initialSize = 0;

		if (isResizableOptions(options)) {
			if (options.growSize <= 0) {
				throw new SyntaxError(`Storage can not have a grow size of 0.`);
			}

			this.autoGrow = true;
			initialSize = options.initialSize || 0;
			this.data = options.resize(data, initialSize);
		}
		else if (isFixedOptions(options)) {
			if (options.size <= 0) {
				throw new SyntaxError(`Storage can not have a size of 0.`);
			}

			this.autoGrow = false;
			initialSize = options.size;
		} else {
			throw new SyntaxError(`Storage options is neither StorageOptionsResizable, nor StorageOptionsFixed.`);
		}

		this.head = new Block<T, I>(this, true, 0, initialSize, undefined, undefined);
		this.tail = this.head;
	}

	alloc(size: number): Block<T, I>
	alloc(items: any[]): Block<T, I>
	alloc(arg: number | any[]): Block<T, I> {
		const size = typeof arg === 'number' ? arg : arg.length;
		const items = isArray(arg) ? arg as number[] : undefined;

		let allocBlock: Block<T, I> | undefined;

		for (
			let block: Block<T, I> | undefined = this.head;
			block !== undefined;
			block = block.right
		) {
			if (block.freed) {
				if (block.size === size) {
					allocBlock = block;
					(allocBlock as Mutable<Block<T, I>>).freed = false;
					break;
				}
				else if (block.size > size) {
					allocBlock = new Block<T, I>(this, false, block.offset, size, block.left, block);
					if (block.left) {
						moveTo(block.left, block.left.offset, block.left.left, allocBlock);
					}
					moveTo(block, block.offset + size, allocBlock, block.right);

					if (this.head === block) {
						(this as Mutable<Storage<T, I>>).head = allocBlock;
					}
					if (this.tail === block) {
						(this as Mutable<Storage<T, I>>).tail = allocBlock;
					}
					break;
				}
			}
		}

		if (allocBlock === undefined) {
			if (this.autoGrow === false) {
				throw new RangeError(`Storage can not grow to allocate new block size of ${size}.`);
			}
			this.defrag();

			const currentSize = this.tail.offset + this.tail.size;
			const growSize = (this.options as StorageOptionsResizable<T, I>).growSize;
			const newSize = currentSize + Math.ceil(size / growSize) * growSize;

			if (this.tail.freed) {
				resizeTo(this.tail, this.tail.size + (newSize - currentSize));
			} else {
				const tail = new Block<T, I>(this, true, currentSize, newSize - currentSize, this.tail, undefined);
				moveTo(this.tail, this.tail.offset, this.tail.left, tail);
				(this as Mutable<Storage<T, I>>).tail = tail;
			}

			(this as Mutable<Storage<T, I>>).data = (this.options as StorageOptionsResizable<T, I>).resize(this.data, newSize);

			if (items) {
				return this.alloc(items);
			}
			return this.alloc(size);
		} else {
			return allocBlock;
		}
	}

	free(block: Block<T, I>) {
		if (block.freed === false) {
			(block as Mutable<Block<T, I>>).freed = true;

			let destroyBlock = false;

			// Grow left block if it's freed
			if (block.left && block.left.freed) {
				resizeTo(block.left, block.left.size + block.size);
				moveTo(block.left, block.left.offset, block.left.left, block.right);
				if (block.right) {
					moveTo(block.right, block.right.offset, block.left, block.right.right);
				}
				destroyBlock = true;
			}

			// Grow left block if it's freed
			if (block.right && block.right.freed) {
				resizeTo(block.right, block.right.size + block.size);
				moveTo(block.right, block.right.offset, block.left, block.right.right);
				if (block.left) {
					moveTo(block.left, block.left.offset, block.left.left, block.right);
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
		let block: Block<T, I> | undefined = this.head;
		let left: Block<T, I> | undefined;
		let offset = 0;
		const currentSize = this.tail.offset + this.tail.size;

		while (block !== undefined) {
			if (block.freed === false) {
				moveTo(block, offset, left, block.right);
				offset += block.size;

				if (left) {
					moveTo(left, left.offset, left.left, block);
				}

				left = block;
				block = block.right;
			} else {
				const right = block.right;
				destroy(block);

				block = right;
			}
		}

		if (left && left.offset + left.size < currentSize) {
			const tail = new Block<T, I>(this, true, left.offset + left.size, currentSize - (left.offset + left.size), left, undefined);
			moveTo(left, left.offset, left.left, tail);
			(this as Mutable<Storage<T, I>>).tail = tail;
		}
	}

	shrink() {
		if (this.autoGrow && this.tail.freed) {
			if (this.tail.left) {
				const currentSize = this.tail.offset + this.tail.size;
				const growSize = (this.options as StorageOptionsResizable<T, I>).growSize;
				const newSize = currentSize + Math.ceil(this.tail.offset / growSize) * growSize;

				(this as Mutable<Storage<T, I>>).data = (this.options as StorageOptionsResizable<T, I>).resize(this.data, newSize);
			} else {
				(this as Mutable<Storage<T, I>>).data = (this.options as StorageOptionsResizable<T, I>).resize(this.data, 0);
			}
			resizeTo(this.tail, 0);
		}
	}
}

export class Block<T = any, I = any> {
	constructor(
		public readonly storage: Storage<T, I>,
		public readonly freed: boolean,
		public readonly offset: number,
		public readonly size: number,
		public readonly left: Block<T, I> | undefined,
		public readonly right: Block<T, I> | undefined,
	) {

	}

	set(index: number, ...values: I[]) {
		const data = this.storage.data;
		const setter = this.storage.options.set;
		for (let i = 0, l = values.length; i < l; ++i) {
			setter(data, this.offset + index + i, values[i]);
		}
	}

	get(index: number): I {
		// return this.memory.buffer[this.offset + index];
		return this.storage.options.get(this.storage.data, index);
	}
}

function moveTo(block: Block, offset: number, newLeft: Block | undefined, newRight: Block | undefined) {
	if(offset !== block.offset) {
		block.storage.options.move(block.storage.data, block, offset);
		(block as Mutable<Block>).offset = offset;
	}
	(block as Mutable<Block>).left = newLeft;
	(block as Mutable<Block>).right = newRight;
}

function resizeTo(block: Block, size: number) {
	(block as Mutable<Block>).size = size;
}

function destroy(block: Block<any>) {
	(block as any).storage = undefined;
	(block as any).offset = undefined;
	(block as any).size = undefined;
	(block as any).left = undefined;
	(block as any).right = undefined;
}