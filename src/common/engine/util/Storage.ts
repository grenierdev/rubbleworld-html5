import { Mutable } from "./Mutable";
import { isArray } from "util";

export type StorageOptions<T> = StorageOptionsResizable<T> | StorageOptionsFixed<T>

export interface StorageOptionsResizable<T> {
	initialSize?: number
	growSize: number
	resize: (data: T, size: number) => T
	move: (block: Block<T>, offset: number, data: T) => void
}

export interface StorageOptionsFixed<T> {
	size: number
	move: (block: Block<T>, offset: number, data: T) => void
}

function isResizableOptions(options: any): options is StorageOptionsResizable<any> {
	return typeof options.initialSize === 'number' && typeof options.resize === 'function';
}

function isFixedOptions(options: any): options is StorageOptionsFixed<any> {
	return typeof options.size !== 'undefined';
}

export class Storage<T = any> {
	protected static blockConstructor: typeof Block;

	public readonly head: Block<T>;
	public readonly tail: Block<T>;

	private autoGrow: boolean;

	constructor(
		public readonly data: T,
		public readonly options: StorageOptions<T>
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

		this.head = new Block<T>(this, true, 0, initialSize, undefined, undefined);
		this.tail = this.head;
	}

	alloc(size: number): Block<T>
	alloc(items: any[]): Block<T>
	alloc(arg: number | any[]): Block<T> {
		const size = typeof arg === 'number' ? arg : arg.length;
		const items = isArray(arg) ? arg as number[] : undefined;

		let allocBlock: Block<T> | undefined;

		for (
			let block: Block<T> | undefined = this.head;
			block !== undefined;
			block = block.right
		) {
			if (block.freed) {
				if (block.size === size) {
					allocBlock = block;
					(allocBlock as Mutable<Block<T>>).freed = false;
					break;
				}
				else if (block.size > size) {
					allocBlock = new Block<T>(this, false, block.offset, size, block.left, block);
					if (block.left) {
						moveTo(block.left, block.left.offset, block.left.left, allocBlock);
					}
					moveTo(block, block.offset + size, allocBlock, block.right);

					if (this.head === block) {
						(this as Mutable<Storage<T>>).head = allocBlock;
					}
					if (this.tail === block) {
						(this as Mutable<Storage<T>>).tail = allocBlock;
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
			const growSize = (this.options as StorageOptionsResizable<T>).growSize;
			const newSize = currentSize + Math.ceil(size / growSize) * growSize;

			if (this.tail.freed) {
				resizeTo(this.tail, this.tail.size + (newSize - currentSize));
			} else {
				const tail = new Block<T>(this, true, currentSize, newSize - currentSize, this.tail, undefined);
				moveTo(this.tail, this.tail.offset, this.tail.left, tail);
				(this as Mutable<Storage<T>>).tail = tail;
			}

			(this as Mutable<Storage<T>>).data = (this.options as StorageOptionsResizable<T>).resize(this.data, newSize);

			if (items) {
				return this.alloc(items);
			}
			return this.alloc(size);
		} else {
			return allocBlock;
		}
	}

	free(block: Block<T>) {
		if (block.freed === false) {
			(block as Mutable<Block<T>>).freed = true;

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
		let block: Block<T> | undefined = this.head;
		let left: Block<T> | undefined;
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
			const tail = new Block<T>(this, true, left.offset + left.size, currentSize - (left.offset + left.size), left, undefined);
			moveTo(left, left.offset, left.left, tail);
			(this as Mutable<Storage<T>>).tail = tail;
		}
	}

	shrink() {
		if (this.autoGrow && this.tail.freed) {
			if (this.tail.left) {
				const currentSize = this.tail.offset + this.tail.size;
				const growSize = (this.options as StorageOptionsResizable<T>).growSize;
				const newSize = currentSize + Math.ceil(this.tail.offset / growSize) * growSize;

				(this as Mutable<Storage<T>>).data = (this.options as StorageOptionsResizable<T>).resize(this.data, newSize);
			} else {
				(this as Mutable<Storage<T>>).data = (this.options as StorageOptionsResizable<T>).resize(this.data, 0);
			}
			resizeTo(this.tail, 0);
		}
	}
}

export class Block<T = any> {
	constructor(
		public readonly storage: Storage<T>,
		public readonly freed: boolean,
		public readonly offset: number,
		public readonly size: number,
		public readonly left: Block<T> | undefined,
		public readonly right: Block<T> | undefined,
	) {

	}
}

function moveTo(block: Block, offset: number, newLeft: Block | undefined, newRight: Block | undefined) {
	if(offset !== block.offset) {
		block.storage.options.move(block, offset, block.storage.data);
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