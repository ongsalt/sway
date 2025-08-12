import { listen } from ".";
import { getActiveComponentScope, templateEffect } from "../reactivity";
import type { ValueProxy } from "../utils/reactivity";

export function bind<T>(node: Node, attribute: string, valueProxy: ValueProxy<T>) {
    if (!(node instanceof Element)) {
        throw new Error(`${node} is not an Element.`);
    }
    const isInput = node instanceof HTMLInputElement;
    const isTextArea = node instanceof HTMLTextAreaElement;
    if ((isInput || isTextArea) && attribute === "value") {
        // @ts-ignore TODO: fix this later
        bindTextInput(node as TextInputElement, valueProxy);
    } else if (isInput && attribute === "checked" && node?.type === "checkbox") {
        // @ts-ignore fuck this
        bindCheckbox(node, valueProxy);
    } else {
        throw new Error(`${node} is not bindable.`);
    }
}

type TextInputElement = HTMLInputElement | HTMLTextAreaElement;
function bindTextInput(element: TextInputElement, valueProxy: ValueProxy<string>) {
    // type inference is kinda shit
    element.value = valueProxy.get();

    listen(element, "input", () => (event) => {
        const { value } = element;
        if (element.type === "number" || element.type === "range") {
            parseFloat(value);
        } else {
            valueProxy.set(value);
        }
    });

    valueProxy.onValue(value => {
        element.value = value;
    });
}

function bindCheckbox(element: HTMLInputElement, valueProxy: ValueProxy<boolean>) { // only type="checkbox"
    if (element.type !== "checkbox") {
        throw new Error(`${element} is not a checkbox.`);
    }

    element.checked = valueProxy.get();

    listen(element, "input", () => (event) => {
        valueProxy.set(element.checked);
    });

    valueProxy.onValue(value => {
        element.checked = value;
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


// T should be component binding or html element
export function bindThis<T>(setter: (instance: T) => any, instance: T) {
    const scope = getActiveComponentScope();
    scope?.defer(() => setter(instance), 1);
}

