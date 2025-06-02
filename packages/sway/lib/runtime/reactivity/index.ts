import { createComputed, createEffect, createEffectScope, createSignal, destroy, get, set, withScope } from "./internal";

export function signal<T>(initial: T) {
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

export function computed<T>(fn: () => T) {
    const c = createComputed(fn);
    return {
        get value(): T {
            return get(c);
        },
    };
}


// TODO: cleanup
export function effect(fn: () => unknown) {
    const e = createEffect(fn);

    return () => destroy(e);
}

export function effectScope() {
    const scope = createEffectScope();

    return {
        run: <T>(fn: () => T) => withScope(scope, fn),
        destroy: () => destroy(scope),
    };
};