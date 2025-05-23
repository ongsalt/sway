// import { CleanupFn } from "./signal";
import { Component } from "../types";

type CleanupFn = () => unknown;
declare global {
    interface Element {
        $$cleanups?: CleanupFn[];
    }
}

export function children(fragment: Node | Node[], index = 0): Node {
    if (Array.isArray(fragment)) {
        return fragment[index];
    }
    return fragment.childNodes[index];
}

export function sibling(node: Node, index: number) {
    console.log(node, index);
    return children(node.parentNode!, index);
    // while (index > 0) {
    //     node = node.nextSibling!
    //     console.log(node)
    //     index -= 1;
    // }

    // return node
}

export function append(anchor: Node, fragment: Node | Node[] | DocumentFragment, before = false) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    let currentAnchor = before ? anchor : anchor.nextSibling;
    if (fragment instanceof DocumentFragment) {
        parent.insertBefore(fragment, currentAnchor);
    } else if (Array.isArray(fragment)) {
        for (const node of fragment) {
            parent.insertBefore(node, currentAnchor);
        }
    } else {
        parent.insertBefore(fragment, currentAnchor);
    }
}

export function comment(data = '') {
    return document.createComment(data);
}

export function remove(node: Node) {
    if (node instanceof Element) { // TODO: make ts shut up 
        node.$$cleanups?.forEach(cleanup => cleanup());
    }
    // console.log(node)
    node.parentNode!.removeChild(node);
}

export function mount(component: Component, root: HTMLElement) {
    const anchor = comment();
    root.appendChild(anchor);

    // Start component context????
    // compiler then need to generate code for this 
    // $.push() & $.pop() ??
    component({ anchor });
    // should return unmount()
}

// TODO: Listener should be inside an effect
export function listen<E extends Element>(element: E, type: keyof HTMLElementEventMap, listener: EventListenerOrEventListenerObject) {
    // console.log("ajhufysik")
    element.addEventListener(type, listener);
    if (!element.$$cleanups) {
        element.$$cleanups = [];
    }
    element.$$cleanups.push(() => element.removeEventListener(type, listener));
    // console.log(element)
}

// exclusive
export function sweep(from: Node, to: Node | null) {
    let current = from.nextSibling;
    while (current != to) {
        const toRemove = current!;
        current = current!?.nextSibling;
        remove(toRemove);
    }
}

export function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`);
    }

    node.textContent = text;
}

export function setAttribute(element: Element, attributes: string, value: string) {
    element.setAttribute(attributes, value);
}
