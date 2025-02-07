import { CleanupFn } from "../signal"

export type CurrentComponent = {
    type: "component",
    cleanups: CleanupFn[],
    previous?: CurrentScope,
    onMounts: OnMountFn[],
    onDestroys: OnDestroyFn[],
}

// each scope should wrap it own clean up and push it to previous.cleanups 
export type CurrentIf = {
    type: "if",
    cleanups: CleanupFn[],
    previous?: CurrentScope,
}

export type CurrentEach = {
    type: "each",
    cleanups: CleanupFn[],
    previous?: CurrentScope,
}

export type CurrentScope = CurrentComponent | CurrentIf | CurrentEach

export type OnMountFn = () => (CleanupFn | undefined)
export type OnDestroyFn = () => void

export type TuanContext = {
    currentScope: CurrentScope | undefined
}
export const tuanContext: TuanContext = {
    currentScope: undefined
}

export function getCurrentComponent(): CurrentComponent | undefined {
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

