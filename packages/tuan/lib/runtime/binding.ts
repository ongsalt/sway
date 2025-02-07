// TODO: implement this in lexer and parser

import { effect, Signal } from "../signal"

export type BindableAttribute = "value"

export function bind(node: Node, attribute: BindableAttribute, target: Signal<any>) {
    if (attribute === "value") {
        bindTextInputValue(node as H, target)
    }
}

type H = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
function bindTextInputValue(element: H, target: Signal<any>) {
    // type inference is kinda shit
    element.addEventListener("input", (event) => {
        target.value = (event.target as H).value
    })

    effect(() => {
        element.value = target.value
    })
    // listen(, "input", (event) => {
    //     event.target.value
    // })
}

function bindBooleanInputValue(element: HTMLInputElement) { // only type="checkbox"

}
