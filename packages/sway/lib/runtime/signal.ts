import { RuntimeScope, swayContext } from "./scope";

export type Subscriber = EffectImpl
export interface Signal<T> {
    value: T
}

export type Computed<T> = {
    readonly value: T
}

export interface State {
    addSubscriber(subscriber: EffectImpl): void;
    removeSubscriber(subscriber: EffectImpl): void;
    dispose(): void;
}

export interface EffectController {
    track(signal: State): void;
    addChild(effect: EffectImpl): void;
    dispose(): void;
}

export let currentEffect: EffectImpl | null = null;

export type CleanupFn = () => unknown
export type EffectFn = () => (CleanupFn | void)

export class EffectImpl {
    private parent?: RuntimeScope
    private userCleanup: CleanupFn | undefined
    private dependencies: Set<State>

    constructor(private fn: EffectFn) {
        this.parent = swayContext.currentScope
        if (this.parent) {
            // console.log(this.parent, fn)
            this.parent.effects.add(this)
        }
        this.dependencies = new Set()
    }

    track(signal: State) {
        this.dependencies.add(signal)
        signal.addSubscriber(this)
    }

    dispose(fromSelf = false) {
        if (this.parent && !fromSelf) {
            this.parent.effects.delete(this)
        }

        this.dependencies.forEach(it => it.removeSubscriber(this));

        // TODO: do we really need these 2 (ok we need this in case of nested shit)
        if (this.userCleanup) {
            // should not be tracked
            this.userCleanup()
            this.userCleanup = undefined
        }

    }

    run() {
        this.dispose(true)

        const previous = currentEffect
        // TODO: dont allow nested effect
        currentEffect = this
        const userCleanup = this.fn()
        if (typeof userCleanup === "function") {
            // add to cleanups
            // TODO: think about this
            this.userCleanup = userCleanup
        }
        // console.log(this.children)
        currentEffect = previous;
    }
}


/*
    this AND THE SCOPE own effect.
    component scope own this and might call dispose

    Disposing:
        - remove all effect references (pracitcally gc it)
        - signal scope will get gc when the controller is out of scope
          so it's when we destroy the owner component scope 
*/

export class SignalImpl<T> implements State {
    private scope?: RuntimeScope
    private value: T
    private subscribers = new Set<EffectImpl>()
    private skip = new Set<EffectImpl>()
    private debug?: string

    constructor(initial: T, debug?: string) {
        this.scope = swayContext.currentScope
        if (this.scope) {
            this.scope.states.add(this)
        }
        this.value = initial
        this.debug = debug
    }

    addSubscriber(subscriber: EffectImpl) {
        this.subscribers.add(subscriber)
    }

    removeSubscriber(subscriber: EffectImpl) {
        this.subscribers.delete(subscriber)
        this.skip.add(subscriber)
        if (this.debug) {
            console.log(`[${this.debug}] Removed per request`, subscriber)
        }
    }

    dispose() {
        if (this.debug) {
            console.log(`[${this.debug}] Signal Disposed`)
        }
        for (const subscriber of this.subscribers) {
            subscriber.dispose()
        }
        this.subscribers.clear()

        if (this.scope) {
            this.scope.states.delete(this)
        }
    }

    get() {
        if (currentEffect) {
            currentEffect.track(this)
        }

        if (this.debug) {
            console.log(this.subscribers)
        }

        return this.value
    }

    set(newValue: T) {
        if (this.value === newValue) return; // ???
        this.value = newValue

        if (this.debug) {
            console.log(`Updated to ${JSON.stringify(newValue)}`)
            console.log(this.subscribers)
        }

        for (const subscriber of this.subscribers) {
            if (!this.skip.has(subscriber)) {
                subscriber.run()
            }
        }
        this.skip.clear()
    }
}

export function signal<T>(initial: T, debug?: string): Signal<T> {
    // if we pull this object from scope instead of creating new one
    // i think we can do hot reload like react
    // but then we need to introduce the rule of hooks
    // and just do force refresh if something go wrong
    const impl = new SignalImpl(initial, debug)

    return {
        get value() {
            return impl.get()
        },
        set value(newValue) {
            impl.set(newValue)
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

class ReactiveObject<T extends Object> implements State {
    private scope?: RuntimeScope
    private parent?: ReactiveObject<any>
    private value: T
    private subscribers = new Set<EffectImpl>()
    private skip = new Set<EffectImpl>()
    private debug?: string

    constructor(initial: T, parent?: ReactiveObject<any>, debug?: string) {
        this.scope = swayContext.currentScope
        this.parent = parent
        if (this.scope && !parent) {
            this.scope.states.add(this)
        }
        this.value = initial
        this.debug = debug
    }

    addSubscriber(subscriber: EffectImpl) {
        if (this.parent) {
            this.parent.addSubscriber(subscriber)
            return
        }

        this.subscribers.add(subscriber)

    }

    removeSubscriber(subscriber: EffectImpl) {
        if (this.parent) {
            this.parent.removeSubscriber(subscriber)
            return
        }

        this.subscribers.delete(subscriber)
        this.skip.add(subscriber)
        if (this.debug) {
            console.log(`[${this.debug}] Removed per request`, subscriber)
        }
    }

    dispose() {
        if (this.parent) {
            return
        }
        if (this.debug) {
            console.log(`[${this.debug}] Signal Disposed`)
        }
        for (const subscriber of this.subscribers) {
            subscriber.dispose()
        }
        this.subscribers.clear()

        if (this.scope) {
            this.scope.states.delete(this)
        }
    }

    get(): T {
        const deez = this;
        return new Proxy(deez.value, {
            get(target, p, receiver) {
                if (currentEffect) {
                    // TODO: cache this or else Set would not work
                    currentEffect.track(deez)
                }

                const prop = Reflect.get(target, p, receiver)
                if (typeof prop === "object" && prop !== null) {
                    // will this get cleanup properly
                    // well the subscriber is gonna get auto cleanup so probably yes 
                    // wait does this mean most of our cleanup implementation is redundant???
                    // TODO: before cleanup check what we really remove
                    // TODO: stop notifying everyone when a single key change
                    // maybe we could do this by add path properties to our subscriber 
                    return new ReactiveObject(prop, deez?.parent ?? deez, deez.debug).get()
                }

                return prop
            },

            set(target, p, newValue, receiver) {
                const ok = Reflect.set(target, p, newValue, receiver)
                if (!ok) {
                    return false
                }

                // do i need to tag it
                const subscribers = deez.parent?.subscribers ?? deez.subscribers
                const skip = deez.parent?.skip ?? deez.skip
                for (const subscriber of subscribers) {
                    if (!skip.has(subscriber)) {
                        subscriber.run()
                    }
                }
                skip.clear()
                return true
            },
        })
    }
}

// todo: remove skip 
export function reactive<T extends object>(target: T): T {
    const impl = new ReactiveObject(target)
    return impl.get()
}


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

// TODO: parse key `nested.like.this`
export function proxy<T extends Object, K extends keyof T>(obj: T, key: K): SwayProxy<T[K]> {
    return {
        get value() {
            return obj[key]
        },
        set value(v) {
            obj[key] = v
        }
    }
}

export type SwayProxy<T> = {
    value: T
}
