import { templateEffect } from "../reactivity";
import { createRuntime } from "../internal";
import { bind } from "./binding";

type CleanupFn = () => unknown;
declare global {
    interface Element {
        $$cleanups?: CleanupFn[];
    }
}

function children(fragment: Node | Node[], index = 0): Node {
    if (Array.isArray(fragment)) {
        return fragment[index];
    }
    return fragment.childNodes[index];
}

// TODO: $.reset, and internal `current` node state
function sibling(node: Node, index: number) {
    console.log(node, index);
    return children(node.parentNode!, index);
    // while (index > 0) {
    //     node = node.nextSibling!
    //     console.log(node)
    //     index -= 1;
    // }

    // return node
}

function append(anchor: Node, fragment: Node | Node[] | DocumentFragment, before = false) {
    // i want insertAfter but whatever
    const parent = anchor.parentNode!;
    console.log({ anchor })
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

function comment(data = 'runtime-comment') {
    return document.createComment(data);
}

function remove(node: Node) {
    if (node instanceof Element) { // TODO: make ts shut up 
        node.$$cleanups?.forEach(cleanup => cleanup());
    }
    // console.log(node)
    node.parentNode!.removeChild(node);
}

export type MountOptions<Props extends Record<string, any>, HostNode = Node> = {
    root: HostNode;
    anchor?: HostNode; // TODO: make this opional again
    props: Props;
};

export function listen<E extends Element>(element: E, type: keyof HTMLElementEventMap, createListener: () => EventListenerOrEventListenerObject) {
    templateEffect(() => {
        const listener = createListener();
        element.addEventListener(type, listener);

        return () => {
            element.removeEventListener(type, listener);
        };
    });
}

// exclusive
function sweep(from: Node, to: Node | null) {
    let current = from.nextSibling;
    while (current != to) {
        const toRemove = current!;
        current = current!?.nextSibling;
        remove(toRemove);
    }
}

function setText(node: Node, text: string) {
    if (node.nodeType !== 3) {
        throw new Error(`${node} is not a text node`);
    }

    node.textContent = text;
}

function setAttribute(element: Element, attributes: string, value: string) {
    element.setAttribute(attributes, value);
}

const { mount, runtime } = createRuntime<Node, Element, DocumentFragment, Event>({
    addEventListener(element, type, callback) {
        element.addEventListener(type, callback);
    },
    appendNode(node, after) {
        append(node, after);
    },
    appendChild(parent, fragment) {
        parent.appendChild(fragment);
    },
    createBinding(node, key, getter, setter) {
        bind(node, key, getter, setter);
    },
    createComment(text) {
        return comment(text);
    },
    createFragment() {
        return document.createDocumentFragment();
    },
    createText(text) {
        return document.createTextNode(text ?? "");
    },
    getChild(node, index) {
        return children(node, index);
    },
    getNextSibling(node) {
        return node.nextSibling;
    },
    removeEventListener(element, type, callback) {
        element.removeEventListener(type, callback);
    },
    removeNode(node) {
        remove(node);
    },
    setAttribute(element, key, value) {
        setAttribute(element, key, value);
    },
    setText(node, text) {
        setText(node, text);
    },
    createStaticContent(content) {
        const template: HTMLTemplateElement = document.createElement("template");
        template.innerHTML = content;

        return () => template.content.cloneNode(true) as DocumentFragment;
    },
});

export { mount, runtime };