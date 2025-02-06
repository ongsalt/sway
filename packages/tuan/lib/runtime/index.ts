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

export { templateEffect } from "../signal"
export { append, children, comment, mount, sibling, unmount } from "./dom"
export { if, type RenderFn } from "./if"

