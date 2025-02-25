import { CleanupFn, currentEffect, EffectImpl, SignalImpl } from "./signal"

export type RuntimeScope = RuntimeComponentScope | RuntimeEachScope | RuntimeIfScope
export type OnMountFn = () => (CleanupFn | undefined)
export type OnDestroyFn = () => void

export type SwayContext = {
    currentScope: RuntimeScope | undefined
}

export const swayContext: SwayContext = {
    currentScope: undefined
}

class AbstractRuntimeScope {
    cleanups: CleanupFn[]
    children: Set<RuntimeScope>
    previous?: RuntimeScope
    signals: Set<SignalImpl<any>>
    effects: Set<EffectImpl> // only top level effect

    constructor(previous: RuntimeScope | undefined) {
        if (currentEffect) {
            currentEffect // tell it to dispose this 
        }
        this.cleanups = []
        if (previous) {
            this.previous = previous
            previous.children.add(this)
        }
        this.signals = new Set()
        this.effects = new Set()
        this.children = new Set()
    }

    dispose() {
        this.previous?.children.delete(this)
        this.children.forEach(it => it.dispose())
        // this.children.clear()
        
        this.effects.forEach(it => it.dispose())
        // this.effects.clear()

        this.signals.forEach(it => it.dispose())
        // this.signals.clear()

        this.cleanups.forEach(it => it())
        this.cleanups = [] // why tho
    }

    run<T>(fn: () => T) {
        const previous = swayContext.currentScope
        swayContext.currentScope = this
        const value = fn();
        swayContext.currentScope = previous
        return value;
    }

    with<T>(fn: () => T) {
        return () => this.run(fn)
    }
}

export class RuntimeComponentScope extends AbstractRuntimeScope {
    public onMounts: OnMountFn[]
    public onDestroys: OnDestroyFn[]

    constructor(previous: RuntimeScope | undefined) {
        super(previous)
        this.onMounts = []
        this.onDestroys = []
    }
}

export class RuntimeIfScope extends AbstractRuntimeScope {
    constructor(previous: RuntimeScope | undefined) {
        super(previous)
    }
}

export class RuntimeEachScope extends AbstractRuntimeScope {
    constructor(previous: RuntimeScope | undefined) {
        super(previous)
    }
}

export function getNearestComponent(): RuntimeComponentScope | undefined {
    let current = swayContext.currentScope
    while (current) {
        if (current instanceof RuntimeComponentScope) {
            return current
        }
        current = current?.previous
    }
    return undefined
}

export function push() {
    const current: RuntimeScope = new RuntimeComponentScope(swayContext.currentScope)
    if (!swayContext.currentScope) {
        // setInterval(() => {
        //     console.log(current)
        // }, 1000)
    }
    // console.log(current)
    swayContext.currentScope = current;
    // previous?.children.push(current)
}

export function pop() {
    // perform onmount
    swayContext.currentScope = swayContext?.currentScope?.previous
}

export function cleanupScope(scope: RuntimeScope) {
    // scope.children.forEach(cleanupScope)
    // TODO: make the children call onDestroy on its creation instead
    scope.cleanups.forEach(it => it())
    scope.cleanups = []
}

export function onMount(fn: OnMountFn) {

}

export function onDestroy(fn: CleanupFn) {
    swayContext.currentScope?.cleanups.push(fn)
}
