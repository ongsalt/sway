import { tuanContext } from "./scope"

export function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`)
    }

    node.textContent = text
}

export function setAttribute(element: Element, attributes: string, value: string) {
    element.setAttribute(attributes, value)
}

export * from "./signal"

export { append, children, comment, mount, sibling, listen } from "./dom"
export { if, type RenderFn } from "./if"
export { each } from "./each"
export { parse, template } from "./template"
export { bind } from "./binding"
export { pop, push } from "./scope"

export const internal = {
    context: tuanContext
}
