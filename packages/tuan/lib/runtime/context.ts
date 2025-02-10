import { CleanupFn } from "./signal"

type SharedRuntimeContext = {
    cleanups: CleanupFn[],
    previous?: RuntimeContext,
    children: RuntimeContext[]
}

export type RuntimeComponentContext = SharedRuntimeContext & {
    type: "component",
    onMounts: OnMountFn[],
    onDestroys: OnDestroyFn[],
}

// each scope should wrap it own clean up and push it to previous.cleanups 
export type RuntimeIfContext = SharedRuntimeContext & {
    type: "if",
}

export type RuntimeEachContext = SharedRuntimeContext & {
    type: "each",
}

export type RuntimeContext = RuntimeComponentContext | RuntimeEachContext | RuntimeIfContext
export type OnMountFn = () => (CleanupFn | undefined)
export type OnDestroyFn = () => void

export type TuanContext = {
    currentScope: RuntimeContext | undefined
}

export const tuanContext: TuanContext = {
    currentScope: undefined
}

export function getNearestComponent(): RuntimeComponentContext | undefined {
    let current = tuanContext.currentScope
    while (current) {
        if (current.type === "component") {
            return current
        }
        current = current?.previous
    }
    return undefined
}

export function onMount(fn: OnMountFn) {

}

export function onDestroy(fn: OnMountFn) {

}

