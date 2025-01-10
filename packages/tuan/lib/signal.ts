
export type Subscriber = () => unknown
export type Signal<T> = {
    value: T
}

export type Computed<T> = {
    readonly value: T
}

let currentSubscriber: Subscriber | null = null

export function signal<T>(initial: T) {
    let value = initial
    let subscribers = new Set<Subscriber>()

    return {
        get value() {
            if (currentSubscriber) {
                subscribers.add(currentSubscriber)
            }
            return value
        },

        set value(newValue) {
            if (value === newValue) return
            value = newValue
            const previous = subscribers
            subscribers = new Set()
            for (const subscriber of previous) {
                subscriber()
            }
        }
    }
}

export function effect(fn: () => unknown) {
    const withTracking = () => {
        const previousSubscriber = currentSubscriber
        currentSubscriber = withTracking
        fn()
        currentSubscriber = previousSubscriber
    }

    withTracking()
}

export function computed<T>(fn: () => T) {
    let state = signal<T | null>(null)

    const update = () => {
        state.value = fn()
    }

    effect(update)
    return state as Computed<T>
}

// In case there is something else to track/cleanup
// i should track component scope too
// but how do i dispose a subscriber tho
// let currentComponent: Component | null = null

export function templateEffect(fn: () => unknown) {
    effect(fn)
}
