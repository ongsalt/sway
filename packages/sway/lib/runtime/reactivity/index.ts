import { createComputed, createEffect, createEffectScope, createSignal, destroy, get, set, withScope } from "./internal";
import { createProxy, destroyProxy, RELEASE } from "./proxy";

// not the same as in internal.ts
export interface Readable<T = any> {
    readonly value: T;
}

export interface Computed<T = any> extends Readable<T> {
    [COMPUTED]: typeof COMPUTED;
}

export interface Signal<T = any> extends Readable<T> {
    value: T;
    [SIGNAL]: typeof SIGNAL;
}

const SIGNAL = Symbol("signal");
const COMPUTED = Symbol("computed");
const REACTIVE = Symbol("reactive");

export function signal<T>(initial: T) {
    const s = createSignal(initial);
    let proxy: T | null = null;
    return {
        get value(): T {
            const value = get(s);
            if (typeof value === "object" && value !== null && proxy === null) {
                proxy = createProxy(value);
                return proxy;
            }
            return value;
        },
        set value(v: T) {
            if (typeof s.value === "object" && s.value !== null) {
                destroyProxy(s.value);
            }
            proxy = null;
            set(s, v);
        },
        [SIGNAL]: SIGNAL
    } as Signal<T>;
}

export function shallowSignal<T>(initial: T): Signal<T> {
    const s = createSignal(initial);
    return {
        get value(): T {
            return get(s);
        },
        set value(v: T) {
            set(s, v);
        },
        [SIGNAL]: SIGNAL
    };
}

export function computed<T>(fn: () => T): Computed<T> {
    const c = createComputed(fn);
    return {
        get value(): T {
            // TODO: track reading and make this readonly: shallow proxy?
            return get(c);
        },
        [COMPUTED]: COMPUTED
    };
}

export function effect(fn: () => unknown, priority = 3) {
    const e = createEffect(fn, priority);

    return () => destroy(e);
}

export function reactive<T extends object>(obj: T): T {
    return createProxy(obj);
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
