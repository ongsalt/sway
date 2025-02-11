import { CleanupFn } from "./signal"
import { WeakArray } from "./weak-ref"

// Pretty much unused bruh

type SharedRuntimeScope = {
    cleanups: CleanupFn[], // unsub all all signal and run userCleanup
    previous?: RuntimeScope,
    children: WeakArray<RuntimeScope>
    // will when signal is out of scope
}

export type RuntimeComponentScope = SharedRuntimeScope & {
    type: "component",
    onMounts: OnMountFn[],
    onDestroys: OnDestroyFn[],
}

// each scope should wrap it own clean up and push it to previous.cleanups 
export type RuntimeIfScope = SharedRuntimeScope & {
    type: "if",
}

export type RuntimeEachScope = SharedRuntimeScope & {
    type: "each",
}

export type RuntimeScope = RuntimeComponentScope | RuntimeEachScope | RuntimeIfScope
export type OnMountFn = () => (CleanupFn | undefined)
export type OnDestroyFn = () => void

export type SwayContext = {
    currentScope: RuntimeScope | undefined
}

export const swayContext: SwayContext = {
    currentScope: undefined
}

export function getNearestComponent(): RuntimeComponentScope | undefined {
    let current = swayContext.currentScope
    while (current) {
        if (current.type === "component") {
            return current
        }
        current = current?.previous
    }
    return undefined
}

/* caller need to ensure that context.previous is properly setted */
export function withContext(context: RuntimeScope, fn: () => any) {
    return () => {
        const previous = swayContext.currentScope
        swayContext.currentScope = context
        fn();
        swayContext.currentScope = previous
    }
}

export function push(type: RuntimeScope["type"] = "component") {
    const previous = swayContext.currentScope
    const current: RuntimeScope = {
        type,
        previous,
        cleanups: [],

        onDestroys: [],
        onMounts: [],
        children: new WeakArray(),
    }
    swayContext.currentScope = current;
    previous?.children.push(current)
}

export function pop() {
    // perform onmount
    swayContext.currentScope = swayContext?.currentScope?.previous
}

export function cleanupScope(scope: RuntimeScope) {
    scope.children.forEach(cleanupScope)
    // TODO: make the children call onDestroy on its creation instead
    scope.cleanups.forEach(it => it())
    scope.cleanups = []
}

export function onMount(fn: OnMountFn) {

}

export function onDestroy(fn: CleanupFn) {
    swayContext.currentScope?.cleanups.push(fn)
}
