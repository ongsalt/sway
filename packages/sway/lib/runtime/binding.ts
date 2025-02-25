// TODO: implement this in lexer and parser

import { listen } from "./dom";
import { SwayProxy, templateEffect } from "./signal";

export function bind(node: Node, attribute: string, target: SwayProxy<any>) {
    if (!(node instanceof Element)) {
        throw new Error(`${node} is not an Element.`)
    }
    const isInput = node instanceof HTMLInputElement;
    const isTextArea = node instanceof HTMLTextAreaElement;
    if ((isInput || isTextArea) && attribute === "value") {
        bindTextInputValue(node as TextInputElement, target)
    } else if (isInput && attribute === "checked" && node?.type !== "checkbox") {
        bindBooleanInputValue(node, target);
    } else {
        throw new Error(`${node} is not bindable.`)
    }
}

type TextInputElement = HTMLInputElement | HTMLTextAreaElement
function bindTextInputValue(element: TextInputElement, target: SwayProxy<any>) {
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

function bindBooleanInputValue(element: HTMLInputElement, target: SwayProxy<boolean>) { // only type="checkbox"
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
