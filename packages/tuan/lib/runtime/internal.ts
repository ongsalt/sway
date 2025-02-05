
export function children(node: Node, index = 0): Node {
    return node.childNodes[index]
}

let doTrackAppending = false;
let appended: Node[] | undefined = undefined;
export function append(anchor: Node, nodes: Node[]) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    for (const node of nodes) {
        if (doTrackAppending) {
            appended!.push(node)
        }
        parent.insertBefore(node, anchor);
    }
}

export function trackAppending(fn: () => unknown) {
    doTrackAppending = true;
    appended = []
    fn()
    doTrackAppending = false;
    const _appended = appended ?? [];
    appended = undefined;
    return _appended;
}

export function comment(data = '') {
    return document.createComment(data)
}
