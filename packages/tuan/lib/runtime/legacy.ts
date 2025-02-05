import { templateEffect } from "../signal"
import { parse } from "./template"

export function template(html: string) {
    return parse(html)
}

export function nodeAt(root: Node, path: number[]): Node {
    let node = root
    // TODO: multiple root node
    // ignore first node
    path.shift()
    for (const index of path) {
        node = node.childNodes[index]
    }

    return node
}

export function elementAt(root: Element, path: number[]): Element {
    let node = root
    // TODO: multiple root node
    // ignore first node
    path.shift()
    for (const index of path) {
        node = node.children[index]
    }

    return node
}

export function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`)
    }

    node.textContent = text
}

export function nextElement(element: Element, n = 1) {
    for (; n > 0; n -= 1) {
        element = element.nextElementSibling!
    }
    return element
}

export function nextNode(node: Node, n = 1) {
    for (; n > 0; n -= 1) {
        node = node.nextSibling!
    }
    return node
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

export function append(anchor: Node, node: Node) {
    anchor.appendChild(node)
}

export function _if(conditionFn: () => any, then: () => void, _else?: () => void) {
    templateEffect(() => {
        const show = !!conditionFn()

        if (show) {
            
        } else if (_else) {

        }
    })
}

export { templateEffect } from "../signal"
