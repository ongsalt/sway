import { listen } from "./dom";
import { Signal, templateEffect } from "./reactivity";

export function bind<T>(node: Node, attribute: string, getter: () => T, setter: () => unknown) {
    if (!(node instanceof Element)) {
        throw new Error(`${node} is not an Element.`);
    }
    const isInput = node instanceof HTMLInputElement;
    const isTextArea = node instanceof HTMLTextAreaElement;
    if ((isInput || isTextArea) && attribute === "value") {
        // @ts-ignore TODO: fix this later
        bindTextInput(node as TextInputElement, getter, setter);
    } else if (isInput && attribute === "checked" && node?.type === "checkbox") {
        // @ts-ignore fuck this
        bindCheckbox(node, getter, setter);
    } else {
        throw new Error(`${node} is not bindable.`);
    }
}

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;
function bindTextInput(element: TextInputElement, getter: () => string, setter: (value: string) => unknown) {
    // type inference is kinda shit
    listen(element, "input", () => (event) => {
        const { value } = element;
        if (element.type === "number" || element.type === "range") {
            parseFloat(value);
        } else {
            setter(value);
        }
    });

    templateEffect(() => {
        element.value = getter();
    });
}

function bindCheckbox(element: HTMLInputElement, getter: () => boolean, setter: (value: boolean) => unknown) { // only type="checkbox"
    if (element.type !== "checkbox") {
        throw new Error(`${element} is not a checkbox.`);
    }

    listen(element, "input", () => (event) => {
        setter(element.checked);
    });

    templateEffect(() => {
        element.checked = getter();
    });
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
