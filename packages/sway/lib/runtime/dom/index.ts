import { templateEffect } from "../reactivity";
import { createRuntime } from "../runtime";
import { bind as _bind } from "./binding";

type CleanupFn = () => unknown;
declare global {
    interface Element {
        $$cleanups?: CleanupFn[];
    }
}

function _children(fragment: Node | Node[], index = 0): Node {
    if (Array.isArray(fragment)) {
        return fragment[index];
    }
    return fragment.childNodes[index];
}

// TODO: $.reset, and internal `current` node state
function _sibling(node: Node, index: number) {
    console.log(node, index);
    return _children(node.parentNode!, index);
    // while (index > 0) {
    //     node = node.nextSibling!
    //     console.log(node)
    //     index -= 1;
    // }

    // return node
}

function _append(anchor: Node, fragment: Node | Node[] | DocumentFragment, before = false) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    // console.log({ anchor });
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

function _comment(data = 'runtime-comment') {
    return document.createComment(data);
}

function _remove(node: Node) {
    if (node instanceof Element) { // TODO: make ts shut up 
        node.$$cleanups?.forEach(cleanup => cleanup());
    }
    node.parentNode!.removeChild(node);
}

export type MountOptions<Props extends Record<string, any>, HostNode = Node> = {
    root: HostNode;
    anchor?: HostNode; // TODO: make this opional again
    props: Props;
};

export function _listen<E extends Element>(element: E, type: keyof HTMLElementEventMap, createListener: () => EventListenerOrEventListenerObject) {
    templateEffect(() => {
        const listener = createListener();
        element.addEventListener(type, listener);

        return () => {
            element.removeEventListener(type, listener);
        };
    });
}

// exclusive
function _sweep(from: Node, to: Node | null) {
    let current = from.nextSibling;
    while (current != to) {
        const toRemove = current!;
        current = current!?.nextSibling;
        _remove(toRemove);
    }
}

function _setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`);
    }

    node.textContent = text;
}

function _setAttribute(element: Element, attributes: string, value: string) {
    element.setAttribute(attributes, value);
}

const runtime = createRuntime<Node, Element, Event>({
    addEventListener(element, type, callback) {
        element.addEventListener(type, callback);
    },
    append(anchor, node) {
        _append(anchor, node);
    },
    appendChild(parent, fragment) {
        parent.appendChild(fragment);
    },
    createBinding(node, key, valueProxy) {
        _bind(node, key, valueProxy);
    },
    createComment(text) {
        return _comment(text);
    },
    createElement(type) {
        return document.createElement(type);
    },
    createText(text) {
        return document.createTextNode(text ?? "");
    },
    getChild(node, index) {
        return _children(node, index);
    },
    getNextSibling(node) {
        return node.nextSibling;
    },
    removeEventListener(element, type, callback) {
        element.removeEventListener(type, callback);
    },
    removeNode(node) {
        _remove(node);
    },
    setAttribute(element, key, value) {
        _setAttribute(element, key, value);
    },
    setText(node, text) {
        _setText(node, text);
    },
    createStaticContent(content) {
        const template: HTMLTemplateElement = document.createElement("template");
        template.innerHTML = content;

        return () => template.content.cloneNode(true) as DocumentFragment;
    },
});

export default runtime;
export const { mount } = runtime;
