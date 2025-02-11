
export type Subscriber = () => void
export type InternalSignal<T> = {
    value: T,
    subscribers: Set<Subscriber>
}

type WritableSignal<T> = {
    value: T
}
export type { WritableSignal as Signal }


export type Computed<T> = {
    readonly value: T
}

let currentEffect: Effect | null = null;

class Signal<T> {
    #value: T
    subscribers: Set<Effect>
    skip: Set<Effect>

    constructor(initial: T) {
        this.#value = initial
        this.subscribers = new Set<Effect>()
        this.skip = new Set<Effect>()

        // when signal is out of scope we hope that every thing
        // that reference this is also out of scope
        // so we dont need to do manaul cleanup
        // tuanContext.currentScope?.cleanups.push(() => {
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

    removeSubscriber(subscriber: Effect) {
        this.skip.add(subscriber)
        this.subscribers.delete(subscriber)
    }

    addSubscriber(subscriber: Effect) {
        this.subscribers.add(subscriber)
    }
}

export type CleanupFn = () => unknown
export type EffectFn = () => (CleanupFn | void)

class Effect {
    private userCleanup: CleanupFn | undefined
    private dependencies: Set<Signal<any>>
    private children: Set<Effect>

    constructor(private fn: EffectFn) {
        this.dependencies = new Set()
        this.children = new Set()
    }

    track(signal: Signal<any>) {
        this.dependencies.add(signal)
        signal.addSubscriber(this)
    }

    addChild(effect: Effect) {
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

export function signal<T>(initial: T): WritableSignal<T> {
    return new Signal(initial)
}

export function effect(fn: EffectFn) {
    // every signals used own this
    new Effect(fn).run();
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

