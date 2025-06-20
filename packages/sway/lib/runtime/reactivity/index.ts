import { createComputed, createEffect, createEffectScope, createSignal, destroy, Effect, EffectFn, get, getActiveScope, set, updateEffect, withScope } from "./internal";
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

export function effect(fn: EffectFn, priority = 3) {
    const e = createEffect(fn, priority);
    const c = getActiveComponentScope();
    if (c) {
        c.deferEffect(e);
    } else {
        // eagerly run it except when use inside a component
        updateEffect(e);
    }

    return () => destroy(e);
}

export function reactive<T extends object>(obj: T): T {
    return createProxy(obj);
}

export function templateEffect(fn: EffectFn) {
    return effect(fn, 2);
}

export interface EffectScope {
    run: <T>(fn: () => T) => T;
    destroy: () => void;
}

export interface ComponentScope {
    markAsInitialized: () => void;
    deferEffect: (effect: Effect) => void;
}


export function effectScope(root = false): EffectScope {
    const scope = createEffectScope(root);

    return {
        run: <T>(fn: () => T) => withScope(scope, fn),
        destroy: () => destroy(scope),
    };
};

let currentComponentScope: ComponentScope[] = [];

export function getActiveComponentScope(): ComponentScope | null {
    return currentComponentScope.at(-1) ?? null;
}

export function push() {
    currentComponentScope.push(componentScope());
}

export function pop() {
    const top = currentComponentScope.pop();
    if (!top) {
        throw new Error("wtf how");
    }
    top!.markAsInitialized();
}

export function componentScope(): ComponentScope {
    const parentEffectScope = getActiveScope();
    const deferredEffects = new Set<Effect>();
    let initialized = false;

    // effect(() => () => deferredEffects.clear());

    return {
        markAsInitialized: () => {
            if (initialized) return;
            const update = () => {
                for (const effect of deferredEffects) {
                    updateEffect(effect);
                }
                deferredEffects.clear();
            };
            if (parentEffectScope) {
                withScope(parentEffectScope, update);
            } else {
                update();
            }
            initialized = true;
        },
        deferEffect: (effect: Effect) => {
            deferredEffects.add(effect);
        },
    };
};

export { getActiveScope };
export { untrack } from "./internal";
export { getRawValue as raw } from "./proxy";
