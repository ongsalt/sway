
let activeScope: ReactiveScope | null = null;
let activeComputed: Computed<any> | null = null;
let activeEffect: Effect | null = null;

export class ReactiveScope {
    computeds: Computed<any>[] = [];
    effects: Effect[] = [];

    dispose() {
        // console.log(`[ReactiveScope] Disposing ${this.effects.length} effects`)

        // TODO: we should not need to dispose computed
        // or should i make a computed have reference to depended signals
        for (const computed of this.computeds) {
            computed.dispose();
        }
        this.computeds = [];

        for (const effect of this.effects) {
            effect.dispose();
        }
        this.effects = [];

        // gc go bruh
    }

    run(fn: () => void) {
        const previousScope = activeScope;
        const previousEffect = activeEffect;
        const previousComputed = activeComputed;
        activeScope = this;
        activeEffect = null;
        activeComputed = null;
        fn();
        activeScope = previousScope;
        activeEffect = previousEffect;
        activeComputed = previousComputed;
    }
}

// so svelte use (vue-like) reactive by default
// except when its primitive which will fallback to (vue-lie)shallowRef
type ReactiveValue<T> = Signal<T> | Computed<T>;
export class Signal<T> implements State<T> {
    private _value: T;
    private computeds = new Set<Computed<any>>;
    private effects = new Set<Effect>();

    constructor(initial: T) {
        this._value = initial;
    }

    get value(): T {
        return this.get();
    }

    set value(newValue: T) {
        this.set(newValue);
    }

    getRaw(): T {
        if (activeComputed) {
            activeComputed.dependencies.push(this);
            this.computeds.add(activeComputed);
        }
        if (activeEffect) {
            activeEffect.dependencies.push(this);
            this.effects.add(activeEffect);
        }
        return this._value;
    }

    // TODO: move this to a proxy function, and only implement the getRaw method
    //       and make a class not reactive?
    //       oh, ok: https://svelte.dev/docs/svelte/$state#Deep-state
    //       State is proxified recursively until Svelte finds something other than an array or simple object (like a class) 
    get(): T {
        // TODO: cache this
        const value = this.getRaw();
        if (typeof value === "object" && value !== null) {
            return makeProxy(value, () => this.trigger());
        }
        return value;
    }

    set(newValue: T) {
        this._value = newValue;
        this.trigger();
    }

    trigger() {
        for (const computed of this.computeds) {
            computed.markDirty();
        }

        const cached = [...this.effects];
        this.effects.clear();
        for (const effect of cached) {
            effect.run();
        }
    }

    removeComputed(computed: Computed<any>) {
        this.computeds.delete(computed);
    }

    removeEffect(effect: Effect) {
        this.effects.delete(effect);
    }

}

export class Computed<T> {
    private _value!: T;
    dependencies: (Signal<any> | Computed<any>)[] = [];
    computeds: Computed<any>[] = [];
    dirty: boolean = true;

    constructor(public computation: () => T) {
        if (activeScope) {
            activeScope.computeds.push(this);
        }
    }

    markDirty() {
        this.dirty = true;
        this.computeds.forEach(it => it.markDirty());
    }

    dispose() {
        for (const dependency of this.dependencies) {
            dependency.removeComputed(this);
        }
    }

    removeComputed(computed: Computed<any>) {
        this.computeds = this.computeds.filter(it => it !== computed);
    }

    private update() {
        const previous = activeComputed;
        activeComputed = this;
        this.dispose();
        this._value = this.computation();
        activeComputed = previous;
    }

    get(): T {
        if (this.dirty) {
            this.update();
        }

        if (activeComputed) {
            this.computeds.push(activeComputed);
        }

        return this._value;
    }

    // TODO: write protection?

    get value(): T {
        return this.get();
    }
}

type CleanUp = () => void;

// TODO: cleanup
export class Effect {
    dependencies: Signal<any>[] = [];
    cleanup: CleanUp | undefined = undefined;

    constructor(public effect: () => void | CleanUp, public priority: number) {
        if (activeScope) {
            activeScope.effects.push(this);
        }
    }

    dispose() {
        if (this.cleanup) {
            this.cleanup();
        }
        for (const signal of this.dependencies) {
            signal.removeEffect(this);
        }
    }


    run() {
        this.dispose();
        // we should cache this 
        const previous = activeEffect;
        if (previous) {
            console.warn(`Nested effect detected. Please use reactiveScope`, this);
        }
        activeEffect = this;
        this.cleanup = this.effect() ?? undefined;
        activeEffect = previous;
    }
}

// TODO: refine public APIs 
export function signal<T>(initial: T): State<T> {
    return new Signal(initial);
}

export function shallow<T>(initial: T): State<T> {
    const signal = new Signal(initial);
    return {
        get value() {
            return signal.getRaw();
        },
        set value(newValue) {
            signal.set(newValue);
        }
    };
}

export function computed<T>(computation: () => T): Computed<T> {
    return new Computed(computation);
}

// wtf
export function watch<T>(dependencies: ReactiveValue<any>[], computation: () => T): Computed<T> {
    return new Computed(() => {
        // track those that were specified
        dependencies.forEach(it => it.get());
        // ignore the rest
        return untrack(() => computation());
    });
};

type EffectFn = () => void | CleanUp;
export function effect(fn: EffectFn, priority = 1) {
    const effect = new Effect(fn, priority);
    effect.run();
    return effect;
}

export function templateEffect(fn: EffectFn) {
    return effect(fn, 0);
}

export function reactiveScope() {
    return new ReactiveScope();
}

export function untrack<T>(fn: () => T) {
    const previousEffect = activeEffect;
    const previousComputed = activeComputed;
    activeEffect = null;
    activeComputed = null;
    const value = fn();
    activeEffect = previousEffect;
    activeComputed = previousComputed;
    return value;
}


type Path = (string | symbol)[];

// TODO: parse key `nested.like.this`, we shuold do something with the compiler
// the compiler know if some identifier is a state or not
// if not -> it should generate this `select` call 
export function select<T extends object, K extends keyof T>(obj: State<T> | T, key: K): State<T[K]> {
    // TODO: shut up ts
    if (isProxied(obj)) {
        return {
            get value() {
                return obj[key];
            },
            set value(v) {
                obj[key] = v;
            }
        };
    }
    if (!isState(obj)) {
        throw new Error("Value is not a proxy or a state");
    }
    return {
        get value() {
            return obj.value[key];
        },
        set value(v) {
            obj.value[key] = v;
            if (obj instanceof Signal) {
                obj.trigger();
            } else {
                console.warn(`Write to a computed detected: ${v}`);
            }
        }
    };
}

// TODO: what if the object got detached, this probably cause unnecessary signal triggering
// TODO: make [Symbol(UNWRAPPED_STATE)]
function makeProxy<T extends object>(obj: T, trigger: () => unknown): T {
    return new Proxy(obj, {
        get(target, prop, receiver) {
            // TODO: fine grained notifying (per key, recursively)
            if (prop === PROXIED_SYMBOL) {
                return true;
            }
            const value = Reflect.get(target, prop, receiver);
            // console.log({ target, prop, receiver, value });

            if (typeof value === "object" && value !== null) { // fuck js
                // fuck class, we gonna ignore that
                if (Object.getPrototypeOf(value) !== Object.prototype) {
                    return value;
                }
                return makeProxy(value, trigger);
            }
            // console.log("not wrap");
            return value;
        },
        set(target, p, newValue) {
            const success = Reflect.set(target, p, newValue);
            if (success) {
                trigger();
            }
            return success;
        },
    });
}

const PROXIED_SYMBOL = Symbol("SWAY_PROXIED");
export interface State<T> {
    value: T;
};

export function isProxied(value: any) {
    return !!value[PROXIED_SYMBOL];
}

export function isState(value: any): value is State<any> {
    return value instanceof Signal || value instanceof Computed;
}


// let previous: T | undefined = undefined;
// let cachedProxy: T | undefined = undefined;
// return {
//     get value() {
//         // shuold this be untrack? nah
//         if (previous === signal.value) {
//             return cachedProxy!;
//         }
//         previous = signal.value;
//         cachedProxy = makeProxy(signal.value, () => signal.trigger());
//         return cachedProxy;
//     },
//     set value(v) {
//         signal.value = v;
//     }
// };
