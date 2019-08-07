export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Immutable<T> = T extends Primitive
	? T
	: T extends Function
	? T
	: T extends Date
	? T
	: T extends Map<infer K, infer V>
	? ImmutableMap<K, V>
	: T extends Array<infer U>
	? ImmutableArray<U>
	: T extends Set<infer U>
	? ImmutableSet<U>
	: T extends {}
	? ImmutableObject<T>
	: unknown;

interface ImmutableArray<T> extends ReadonlyArray<Immutable<T>> {}
interface ImmutableSet<T> extends ReadonlySet<Immutable<T>> {}
interface ImmutableMap<K, V> extends ReadonlyMap<Immutable<K>, Immutable<V>> {}
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type Mutable<T> = T extends Primitive
	? T
	: T extends Function
	? T
	: T extends Date
	? T
	: T extends Map<infer K, infer V>
	? MutableMap<K, V>
	: T extends Array<infer U>
	? MutableArray<U>
	: T extends Set<infer U>
	? MutableSet<U>
	: T extends {}
	? MutableObject<T>
	: T;

interface MutableArray<T> extends Array<Mutable<T>> {}
interface MutableSet<T> extends Set<Mutable<T>> {}
interface MutableMap<K, V> extends Map<Mutable<K>, Mutable<V>> {}
type MutableObject<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
