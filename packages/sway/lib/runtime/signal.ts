
export type Subscriber = () => void
export type InternalSignal<T> = {
    value: T,
    subscribers: Set<Subscriber>
}

export interface Signal<T> {
    value: T
}

export type Computed<T> = {
    readonly value: T
}

let currentEffect: EffectImpl | null = null;

export class SignalImpl<T> implements Signal<T> {
    readonly $_brand = "signal" as const
    #value: T
    subscribers: Set<EffectImpl>
    skip: Set<EffectImpl>

    constructor(initial: T) {
        this.#value = initial
        this.subscribers = new Set<EffectImpl>()
        this.skip = new Set<EffectImpl>()

        // when signal is out of scope we hope that every thing
        // that reference this is also out of scope
        // so we dont need to do manaul cleanup
        // swayContext.currentScope?.cleanups.push(() => {
        //     console.log("Cleaning up signal")

        // })    
    }

    get value() {
        if (currentEffect) {
            currentEffect.track(this)
        }
        return this.#value
    }

    set value(newValue) {
        if (this.#value === newValue) return; // ???
        this.#value = newValue

        for (const subscriber of this.subscribers) {
            if (!this.skip.has(subscriber)) {
                subscriber.run()
            }
        }
        this.skip.clear()
    }

    removeSubscriber(subscriber: EffectImpl) {
        this.skip.add(subscriber)
        this.subscribers.delete(subscriber)
    }

    addSubscriber(subscriber: EffectImpl) {
        this.subscribers.add(subscriber)
    }

    toString() {
        return this.#value // bruhhhhhh
    }
}

export type CleanupFn = () => unknown
export type EffectFn = () => (CleanupFn | void)

export class EffectImpl {
    private userCleanup: CleanupFn | undefined
    private dependencies: Set<SignalImpl<any>>
    private children: Set<EffectImpl>

    constructor(private fn: EffectFn) {
        this.dependencies = new Set()
        this.children = new Set()
    }

    track(signal: SignalImpl<any>) {
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
    return new SignalImpl(initial)
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

// In case there is something else to track/cleanup
// i should track component scope too
// but how do i dispose a subscriber tho
// let currentComponent: Component | null = null

export function templateEffect(fn: EffectFn) {
    effect(fn)
}

export function untrack<T>(fn: () => T) {
    const previous = currentEffect
    currentEffect = null
    const value = fn()
    currentEffect = previous
    return value
}

