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

export type TuanContext = {
    currentScope: RuntimeScope | undefined
}

export const tuanContext: TuanContext = {
    currentScope: undefined
}

export function getNearestComponent(): RuntimeComponentScope | undefined {
    let current = tuanContext.currentScope
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
        const previous = tuanContext.currentScope
        tuanContext.currentScope = context
        fn();
        tuanContext.currentScope = previous
    }
}

export function push(type: RuntimeScope["type"] = "component") {
    const previous = tuanContext.currentScope
    const current: RuntimeScope = {
        type,
        previous,
        cleanups: [],

        onDestroys: [],
        onMounts: [],
        children: new WeakArray(),
    }
    tuanContext.currentScope = current;
    previous?.children.push(current)
}

export function pop() {
    tuanContext.currentScope = tuanContext?.currentScope?.previous
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
    tuanContext.currentScope?.cleanups.push(fn)
}
