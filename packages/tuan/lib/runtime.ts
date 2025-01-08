export function at(root: Element, path: number[]): Element {
    let node = root

    for (const index of path) {
        node = node.children[index] as Element
    }

    return node
}

export function setText(node: HTMLElement, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`)
    }

    node.textContent = text
}