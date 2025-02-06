import { CleanupFn, EffectFn, trackEffect } from "../signal"
import { trackAppending } from "./dom"

export type CurrentComponent = {
    previous?: CurrentComponent,
    effects: EffectFn[]
    onMounts: OnMountFn[]
    onDestroys: OnDestroyFn[]
}

export type OnMountFn = () => (CleanupFn | undefined)
export type OnDestroyFn = () => void

export let currentComponent: CurrentComponent | undefined = undefined;

export function push() {
    currentComponent = {
        previous: currentComponent,
        effects: [],
        onDestroys: [],
        onMounts: []
    }
}

export function pop() {
    const last = currentComponent;
    // Run onMount or smth????
    // and how tf do i know if this thing is destroyed
    // in if or each??? 
    currentComponent = currentComponent?.previous
}

export function withCleanup(fn: () => void): CleanupFn {
    let disposeEffect: CleanupFn;
    const nodes = trackAppending(() => {
        disposeEffect = trackEffect(() => {
            fn()
        })
    })

    const disposeNodes = () => {
        nodes.forEach(it => it.parentNode!.removeChild(it))
    }
    
    return () => {
        disposeEffect()
        disposeNodes()
    } 
}

export function onMount(fn: OnMountFn) {
    if (!currentComponent) {
        return
    }
    currentComponent.onMounts.push(fn);
}

export function onDestroy(fn: OnMountFn) {
    if (!currentComponent) {
        return
    }
    currentComponent.onDestroys.push(fn);
}

