/**
 * Coroutine decorator : convert this generator method to a coroutine
 */
export function coroutine() {
	return function(target, propertyKey: string, descriptor: PropertyDescriptor) {
		const original: (...args: any[]) => IterableIterator<any> =
			descriptor.value;
		if (
			typeof original.prototype !== 'object' ||
			typeof original.prototype[Symbol.iterator] !== 'function'
		) {
			throw new SyntaxError(
				`Coroutine expected ${
					target.constructor.name
				}.${propertyKey} to be a method generator.`
			);
		}
		descriptor.value = function cachedGenerator(...args) {
			let first = false;
			if (this[`$${propertyKey}Cached`] === undefined) {
				first = true;
				this[`$${propertyKey}Cached`] = original.call(this, ...args);
			}
			const next = this[`$${propertyKey}Cached`].next();
			if (next.done === true) {
				this[`$${propertyKey}Cached`] = undefined;
				if (first === false) {
					this[propertyKey](...args);
				}
			}
		};
	};
}
