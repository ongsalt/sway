
export function children(node: Node, index = 0): Node {
    return node.childNodes[index]
}

export function append(anchor: Node, nodes: Node[]) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    for (const node of nodes) {
        parent.insertBefore(node, anchor);
    }
}

export function comment(data = '') {
    return document.createComment(data)
}
