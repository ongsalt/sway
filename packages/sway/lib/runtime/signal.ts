
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

// TODO: Make this deeply reative, maybe by a flag? 
type ReactiveValue<T> = Signal<T> | Computed<T>;
export class Signal<T> {
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

    get(): T {
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
        const previous = activeEffect;
        if (previous) {
            console.warn("Nested effect detected. Please use reactiveScope");
        }
        activeEffect = this;
        this.cleanup = this.effect() ?? undefined;
        activeEffect = previous;
    }
}

// TODO: refine public APIs 
export function signal<T>(initial: T): Signal<T> {
    return new Signal(initial);
}

export function computed<T>(computation: () => T): Computed<T> {
    return new Computed(computation);
}

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

// TODO: parse key `nested.like.this`
export function proxy<T extends Object, K extends keyof T>(obj: Signal<T>, key: K): SwayProxy<T[K]> {
    return {
        get value() {
            return obj.value[key];
        },
        set value(v) {
            obj.value[key] = v;
            obj.trigger()
        }
    };
}

export type SwayProxy<T> = {
    value: T;
};
