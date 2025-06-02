import { createComputed, createEffect, createEffectScope, createSignal, destroy, get, set, withScope } from "./internal";

// not the same as in internal.ts
export interface Readable<T = any> {
    readonly value: T;
}

export type Computed<T = any> = Readable<T>;

export interface Signal<T = any> extends Readable<T> {
    value: T;
}

export function signal<T>(initial: T): Signal<T> {
    const s = createSignal(initial);
    return {
        get value(): T {
            return get(s);
        },
        set value(v: T) {
            set(s, v);
        }
    };
}

export function computed<T>(fn: () => T): Computed<T> {
    const c = createComputed(fn);
    return {
        get value(): T {
            return get(c);
        },
    };
}

// TODO: cleanup
export function effect(fn: () => unknown, priority = 3) {
    const e = createEffect(fn, priority);

    return () => destroy(e);
}

export function templateEffect(fn: () => unknown) {
    return effect(fn, 2);
}

export interface EffectScope {
    run: <T>(fn: () => T) => T;
    destroy: () => void;
}

export function effectScope(root = false): EffectScope {
    const scope = createEffectScope(root);

    return {
        run: <T>(fn: () => T) => withScope(scope, fn),
        destroy: () => destroy(scope),
    };
};

export { untrack } from "./internal";
