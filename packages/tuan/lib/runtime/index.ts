import { templateEffect } from "../signal"
import { parse } from "./template"

export function template(html: string) {
    return parse(html)
}

export function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`)
    }

    node.textContent = text
}

export function setAttribute(element: Element, attributes: string, value: string) {
    element.setAttribute(attributes, value)
}

// TODO: cleanup
export function setListener(element: Element, type: keyof ElementEventMap, listener: () => unknown) {
    element.addEventListener(type, listener)

    // onDestroy(() => element.removeEventListener(type, listener))
    // or call $.reset()
}

// Should anchor be a node
function _if(anchor: Node, effect: () => void) {
    templateEffect(() => {
        // TODO: Clean up anchor and everything else
        effect()
    })
}

export { _if as if };
export { mount, unmount } from "./dom"
export { append, children, comment } from "./internal"
export { templateEffect } from "../signal"
