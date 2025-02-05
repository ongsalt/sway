
export function children(node: Node, index = 0): Node {
    return node.childNodes[index]
}

let appended: Node[] | undefined = undefined;
export function append(anchor: Node, nodes: Node[]) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    for (const node of nodes) {
        if (appended) {
            appended.push(node)
        }
        parent.insertBefore(node, anchor);
    }
}

export function trackAppending(fn: () => unknown) {
    const previousAppended = appended; 
    appended = []
    fn()
    const ret = appended;
    appended = previousAppended;
    return ret;
}

export function comment(data = '') {
    return document.createComment(data)
}
