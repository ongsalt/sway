import { CleanupFn } from "../signal";
import { Component } from "../types";

declare global {
    interface Element {
        $$cleanups?: CleanupFn[]
    }
}

export function children(fragment: Node | Node[], index = 0): Node {
    if (Array.isArray(fragment)) {
        return fragment[index];
    }
    return fragment.childNodes[index];
}

export function sibling(node: Node, index: number) {
    console.log(node, index)
    return children(node.parentNode!, index);
    // while (index > 0) {
    //     node = node.nextSibling!
    //     console.log(node)
    //     index -= 1;
    // }

    // return node
}

let appended: Node[] | undefined = undefined;
export function append(anchor: Node, fragment: Node | Node[] | DocumentFragment) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    if (fragment instanceof DocumentFragment) {
        if (appended) {
            appended.push(...fragment.childNodes)
        }
        parent.insertBefore(fragment, anchor);
    } else if (Array.isArray(fragment)) {
        for (const node of fragment) {
            // console.log("got node list???")
            if (appended) {
                appended.push(node)
            }
            parent.insertBefore(node, anchor);
        }
    } else {
        if (appended) {
            appended.push(fragment)
        }
        parent.insertBefore(fragment, anchor);
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

export function remove(node: Node) {
    node.parentNode!.removeChild(node)
    // node.
}

export function mount(component: Component, root: HTMLElement) {
    const anchor = comment()
    root.appendChild(anchor)
    component({ anchor })

    // should return unmount()
}

// TODO: cleanup
export function listen(element: Element, type: keyof ElementEventMap, listener: () => unknown) {
    element.addEventListener(type, listener)
    if (!element.$$cleanups) {
        element.$$cleanups = []
    }
    element.$$cleanups.push(() => element.removeEventListener(type, listener))
    // console.log(element)
}
