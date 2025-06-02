// TODO: implement this in lexer and parser

import { listen } from "./dom";
import { Signal, templateEffect } from "./reactivity";

export function bind(node: Node, attribute: string, target: Signal<any>) {
    if (!(node instanceof Element)) {
        throw new Error(`${node} is not an Element.`)
    }
    const isInput = node instanceof HTMLInputElement;
    const isTextArea = node instanceof HTMLTextAreaElement;
    if ((isInput || isTextArea) && attribute === "value") {
        bindTextInput(node as TextInputElement, target)
    } else if (isInput && attribute === "checked" && node?.type === "checkbox") {
        bindCheckbox(node, target);
    } else {
        throw new Error(`${node} is not bindable.`)
    }
}

type TextInputElement = HTMLInputElement | HTMLTextAreaElement
function bindTextInput(element: TextInputElement, target: Signal<any>) {
    // type inference is kinda shit
    listen(element, "input", (event) => {
        const { value } = element;
        if (element.type === "number" || element.type === "range") {
            parseFloat(value)
        } else {
            target.value = value
        }
    })

    templateEffect(() => {
        element.value = target.value
    })
}

function bindCheckbox(element: HTMLInputElement, target: Signal<boolean>) { // only type="checkbox"
    if (element.type !== "checkbox") {
        throw new Error(`${element} is not a checkbox.`)
    }

    listen(element, "input", (event) => {
        target.value = element.checked;
    })

    templateEffect(() => {
        element.checked = target.value;
    })
}


// need special handling for HTMLOptionElement we cant use .value directly, 
// use custom attr .__value instead
// function bindSelected(element: HTMLSelectElement) {
//     listen(element, "input", (event) => {
//         target.value = element.checked;
//     })

//     templateEffect(() => {
//         element.checked = target.value;
//     })
// }
