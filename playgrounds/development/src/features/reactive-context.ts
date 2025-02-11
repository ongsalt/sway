import * as $ from "sway/runtime"
import { signal, computed, effect } from "sway"

export const signalRegistry = new WeakMap()

export function reactiveContext() {
    $.push()

    const counter = signal(12)
    const doubled = computed(() => counter.value * 2)

    setInterval(() => {
        counter.value += 1;
    }, 1000)

    effect(() => {
        console.log({
            counter: counter.value,
            doubled: doubled.value,
        })
    })

    const c = $.internal.context.currentScope
    console.log(c)
    $.pop()
    console.log(c)

}