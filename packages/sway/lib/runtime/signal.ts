export type Subscriber = () => void
export interface Signal<T> {
    value: T
}

export type Computed<T> = {
    readonly value: T
}

export interface SignalController {
    removeSubscriber(subscriber: EffectImpl): void;
    addSubscriber(subscriber: EffectImpl): void;
    dispose(): void;
}

export interface ReactiveObjectController extends SignalController {
    addChild(child: ReactiveObjectController): void;
}

export interface EffectController {
    track(signal: SignalController): void;
    addChild(effect: EffectImpl): void;
    dispose(): void;
}

let currentEffect: EffectImpl | null = null;

export type CleanupFn = () => unknown
export type EffectFn = () => (CleanupFn | void)

export class EffectImpl {
    private userCleanup: CleanupFn | undefined
    private dependencies: Set<SignalController>
    private children: Set<EffectImpl>

    constructor(private fn: EffectFn) {
        this.dependencies = new Set()
        this.children = new Set()
    }

    track(signal: SignalController) {
        this.dependencies.add(signal)
        signal.addSubscriber(this)
    }

    addChild(effect: EffectImpl) {
        this.children.add(effect)
    }

    dispose() {
        this.dependencies.forEach(it => it.removeSubscriber(this))
        this.dependencies.clear()
        this.children.forEach(it => it.dispose())
        this.children.clear()
        if (this.userCleanup) {
            // should not be tracked
            this.userCleanup()
            this.userCleanup = undefined
        }
    }

    run() {
        this.dispose()
        const previous = currentEffect
        if (previous) {
            previous.addChild(this)
        }
        currentEffect = this
        const userCleanup = this.fn()
        if (typeof userCleanup === "function") {
            // add to cleanups
            // TODO: think about this
            this.userCleanup = userCleanup
        }
        currentEffect = previous;
    }
}

// public interfaces

export function signal<T>(initial: T): Signal<T> {
    let value = initial
    const subscribers = new Set<EffectImpl>()
    const skip = new Set<EffectImpl>()

    const controller: SignalController = {
        addSubscriber(subscriber) {
            subscribers.add(subscriber)
        },
        removeSubscriber(subscriber) {
            skip.add(subscriber)
            subscribers.delete(subscriber)
        },
        dispose() {
            for (const subscriber of subscribers) {
                subscriber.dispose()
            }
            subscribers.clear()
        },
    }

    return {
        get value() {
            if (currentEffect) {
                currentEffect.track(controller)
            }
            return value
        },

        set value(newValue) {
            if (value === newValue) return; // ???
            value = newValue

            for (const subscriber of subscribers) {
                if (!skip.has(subscriber)) {
                    subscriber.run()
                }
            }
            skip.clear()
        }
    }
}

export function effect(fn: EffectFn) {
    // every signals used own this
    new EffectImpl(fn).run();
}

// TODO: writable computed
export function computed<T>(fn: () => T) {
    let state = signal<T | null>(null)

    effect(() => {
        state.value = fn()
    })

    return state as Computed<T>
}

/*
    Basic requirement:
        - should track effect per property
        - and should not rerun when unrelated property updated
    Recursive case:
        - if that prop is an object return a proxy instead
        - when obj.a is change
            - new instance of proxy -> return reactive(value)
            - old obj.a subscriber should be dispose
            - old obj.a.b subscriber should be dispose (how)
              if a has b controller then when a is disposing it should dispose b first
*/
export function reactive<T extends object>(target: T): T {
    type Context = {
        subscribers: Set<EffectImpl>,
        skip: Set<EffectImpl>,
        children: Set<ReactiveObjectController>,
        dispose: () => void
    }
    const contexts = new Map<symbol | string, Context>();

    function createContext(): Context {
        const subscribers = new Set<EffectImpl>()
        const skip = new Set<EffectImpl>()
        const children = new Set<ReactiveObjectController>()

        return {
            subscribers,
            skip,
            children,            // should be call from parent
            dispose() {
                for (const child of children) {
                    child.dispose()
                }
                children.clear()

                for (const subscriber of subscribers) {
                    subscriber.dispose()
                }
                subscribers.clear()
            }
        }
    }

    function getOrCreateContext(name: string | symbol) {
        let context = contexts.get(name)

        if (!context) {
            context = createContext()
            contexts.set(name, context)
        }

        return context
    }

    return new Proxy(target, {
        get(target, p, receiver) {
            if (currentEffect) {
                // or do i create controller for every key
                const context = getOrCreateContext(p)
                currentEffect.track({
                    addSubscriber(subscriber) {
                        context.subscribers.add(subscriber)
                    },
                    removeSubscriber(subscriber) {
                        context.skip.add(subscriber)
                        context.subscribers.delete(subscriber)
                    },
                    dispose() {
                        context.dispose()
                    },
                })
            }
            // build nested proxy here
            const prop = Reflect.get(target, p, receiver)
            if (typeof prop === "object" && prop !== null) {
                return reactive(prop)
            }

            return prop
        },

        set(target, p, newValue, receiver) {
            const ok = Reflect.set(target, p, newValue, receiver)
            if (!ok) {
                return false
            }

            const context = getOrCreateContext(p)

            // do i need to tag it
            for (const subscriber of context.subscribers) {
                if (!context.skip.has(subscriber)) {
                    subscriber.run()
                }
            }
            context.skip.clear()
            return true
        },
    })
}


// In case there is something else to track/cleanup
// i should track component scope too
// but how do i dispose a subscriber tho
// let currentComponent: Component | null = null

export function templateEffect(fn: EffectFn) {
    // should do something with compoennt scope
    // think about owner
    effect(fn)
}

export function untrack<T>(fn: () => T) {
    const previous = currentEffect
    currentEffect = null
    const value = fn()
    currentEffect = previous
    return value
}

