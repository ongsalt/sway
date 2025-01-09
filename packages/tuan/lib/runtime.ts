import { parse } from "./internal"

export function template(html: string) {
    return parse(html)
}

export function at(root: Node, path: number[]): Node {
    let node = root

    // TODO: multiple root node
    // ignore first node
    path.shift()

    for (const index of path) {
        console.log(node.childNodes)
        node = node.childNodes[index]
    }

    return node
}

export function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`)
    }

    node.textContent = text
}

export function append(anchor: Node, node: Node) {
    anchor.appendChild(node)
}

export { templateEffect } from "./signal"