import { createComputed, createEffect, createEffectScope, createSignal, destroy, Effect, EffectFn, get, getActiveScope, set, untrack, updateEffect, withScope } from "./internal";
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
        c.defer(() => updateEffect(e));
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
    mounted: boolean;
    markAsMounted: () => void;
    defer: (fn: () => any, priority?: number) => void;
}


export function effectScope(root = false): EffectScope {
    const scope = createEffectScope(root);

    return {
        run: <T>(fn: () => T) => withScope(scope, fn),
        destroy: () => destroy(scope),
    };
};

let componentScopeStack: ComponentScope[] = [];

export function getActiveComponentScope(): ComponentScope | null {
    return componentScopeStack.at(-1) ?? null;
}

export function push() {
    componentScopeStack.push(componentScope());
}

export function pop() {
    const top = componentScopeStack.pop();
    if (!top) {
        throw new Error("wtf how");
    }
    const t = componentScopeStack.at(-1);
    if (!t || t.mounted) {
        top.markAsMounted();
    } else {
        onMount(() => top.markAsMounted());
    }
}

export function componentScope(): ComponentScope {
    const parentEffectScope = getActiveScope();
    let deferreds: { fn: () => any, priority: number; }[] = [];
    let mounted = false;

    //  a simple priority queue 
    function defer(fn: () => any, priority = 0) {
        if (!deferreds.length) {
            deferreds.push({ fn, priority });
            return;
        }

        let i = deferreds.length - 1;
        while (i >= 0 && deferreds[i].priority < priority) {
            i--;
        }
        deferreds.splice(i + 1, 0, { fn, priority });
    }

    function onDestroy() {
        deferreds = [];
    }

    function update() {
        for (const { fn } of deferreds) {
            fn();
        }
        deferreds = [];
    };

    // attach onDestroy | This is to by pass the capturing
    const e = createEffect(() => onDestroy, 3);
    updateEffect(e);

    return {
        mounted,
        markAsMounted: () => {
            if (mounted) return;
            if (parentEffectScope) {
                withScope(parentEffectScope, update);
            } else {
                update();
            }
            mounted = true;
        },
        defer
    };
};

export function onMount(fn: EffectFn) {
    effect(() => untrack(fn));
}

export function onDestroy(fn: () => any) {
    effect(() => () => untrack(fn));
}

export { getActiveScope };
export { untrack } from "./internal";
export { getRawValue as raw } from "./proxy";
