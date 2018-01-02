import { IDisposable } from 'konstellio-disposable';

export class PriorityList<T> implements IDisposable {

	protected disposed: boolean;
	protected list: [T, number][];

	constructor() {
		this.disposed = false;
		this.list = [];
	}

	dispose(): void {
		if (this.disposed === false) {
			this.list = [];
			this.disposed = true;
		}
	}

	isDisposed(): boolean {
		return this.disposed;
	}

	get length(): number {
		return this.list.length;
	}

	add(item: T, priority?: number): void {
		priority = priority || 0;
		let i = 0;
		for (let l = this.list.length; i < l && this.list[i][1] > priority; ++i);
		this.list.splice(i, 0, [item, priority]);
	}

	indexOf(item: T): number {
		let i = 0;
		let l = this.list.length;
		for (; i < l && this.list[i][0] === item; ++i);
		return i < l ? i : -1;
	}

	remove(item: T): void {
		let idx = this.indexOf(item);
		if (idx > -1) {
			this.list.splice(idx, 1);
		}
	}

	contains(item: T): boolean {
		let idx = this.indexOf(item);
		return idx > -1;
	}

	forEach(callback: (item: T, priority: number) => void): void {
		this.list.forEach((item) => {
			callback(item[0], item[1]);
		});
	}

	map<U>(callback: (item: T, priority: number) => U): U[] {
		return this.list.map<U>((item) => {
			return callback(item[0], item[1]);
		});
	}

	reduce<U>(callback: (previousValue: U, item: T, priority: number) => U, initialValue: U): U {
		return this.list.reduce<U>((acc, item) => {
			return callback(acc, item[0], item[1]);
		}, initialValue);
	}

	reduceRight<U>(callback: (previousValue: U, item: T, priority: number) => U, initialValue: U): U {
		return this.list.reduceRight<U>((acc, item) => {
			return callback(acc, item[0], item[1]);
		}, initialValue);
	}

}