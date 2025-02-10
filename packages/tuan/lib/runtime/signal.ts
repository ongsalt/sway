
export type Subscriber = () => void
export type Signal<T> = {
    value: T
}

export type Computed<T> = {
    readonly value: T
}


// Should be set in if/each context
// TODO: think about component
export let effectDisposers: Set<() => void> | null = null;
export const effectCleanups = new Map<EffectFn, CleanupFn>()
let currentSubscriber: Subscriber | null = null;

export function signal<T>(initial: T) {
    let value = initial
    let subscribers = new Set<Subscriber>()

    return {
        get value() {
            if (currentSubscriber) {
                subscribers.add(currentSubscriber)

                // We need to wait until currentSubscriber is finished to get cleanup function
                if (effectDisposers) {
                    // just captured this to shutup ts, idk if this is really needed
                    const c = currentSubscriber;
                    effectDisposers.add(() => {
                        const cleanup = effectCleanups.get(c);
                        if (cleanup) {
                            cleanup()
                            effectCleanups.delete(c);
                        }
                        subscribers.delete(c);
                    })
                }
            }
            return value
        },

        set value(newValue) {
            if (value === newValue) return;
            value = newValue
            const previous = subscribers
            subscribers = new Set()
            for (const subscriber of previous) {
                subscriber()
            }
        }
    }
}

export function reactive<T extends object>(object: T) {
    let subscribers = new Set<Subscriber>()

    return new Proxy(object, {
        get(target, p, receiver) {
            if (currentSubscriber) {
                subscribers.add(currentSubscriber)
                // We need to wait until currentSubscriber is finished to get cleanup function
                if (effectDisposers) {
                    // just captured this to shutup ts, idk if this is really needed
                    const c = currentSubscriber;
                    effectDisposers.add(() => {
                        const cleanup = effectCleanups.get(c);
                        if (cleanup) {
                            cleanup()
                            effectCleanups.delete(c);
                        }
                        subscribers.delete(c);
                    })
                }
            }

            // Such a dirty way to implement
            return Reflect.get(target, p, receiver)
        },
        set(target, p, newValue, receiver) {
            // Do something if target is "value"
            const ok = Reflect.set(target, p, newValue, receiver)

            return ok
        },
    })
}

export type CleanupFn = () => unknown
export type EffectFn = () => (CleanupFn | void)

export function effect(fn: EffectFn) {
    const e = () => {
        const previousSubscriber = currentSubscriber
        currentSubscriber = e
        const cleanup = fn()
        if (typeof cleanup === "function") {
            // TODO: think about this
            // You can return a function from $effect, which will run immediately before the effect re-runs, and before it is destroyed
            // register cleanup somehow
            effectCleanups.set(e, cleanup)
        }
        currentSubscriber = previousSubscriber
    }

    e()
}

// TODO: writable computed
export function computed<T>(fn: () => T) {
    let state = signal<T | null>(null)

    effect(() => {
        state.value = fn()
    })

    return state as Computed<T>
}

// In case there is something else to track/cleanup
// i should track component scope too
// but how do i dispose a subscriber tho
// let currentComponent: Component | null = null

export function templateEffect(fn: EffectFn) {
    effect(fn)
}

export function trackEffect(fn: () => void) {
    const previous = effectDisposers;
    effectDisposers = new Set();
    fn()
    const e = effectDisposers;
    // idk if this kind of capturing will cuase memory leak or not;
    const dispose = () => {
        for (const disposeFn of e) {
            disposeFn()
        }
    };
    effectDisposers = previous;
    return dispose;
}

