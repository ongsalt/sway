import { getTransformation } from "./array";
import { RuntimeEachScope, swayContext } from "./scope";
import { append, comment, remove, sweep } from "./dom";
import { CleanupFn, templateEffect } from "./signal";
import { identity } from "./utils";
import { WeakArray } from "./weak-ref";

// any thing that can be compared
type Key = any
type KeyFn<T> = (value: T) => Key

export function each<Item>(
    anchor: Node,
    collection: () => Item[],
    children: (anchor: Node, value: Item, index: number) => void,
    keyFn: KeyFn<Item> = identity // use object reference as key
) {
    const endAnchor = comment();
    append(anchor, endAnchor)

    let currentKeys: Key[] = []
    let childAnchors: Comment[] = []

    function createAnchor(index: number) {
        const anchor = comment()
        // We need a way to put anchor at any arbitary index
        if (index >= childAnchors.length) {
            append(endAnchor, anchor, true)
        } else {
            append(childAnchors[index], anchor, true)
        }
        childAnchors.splice(index, 0, anchor)
        return anchor
    }

    function render(index: number, item: Item) {
        const anchor = createAnchor(index)
        children(anchor, item, index)
    }

    function yeet(index: number) {
        sweep(childAnchors[index], childAnchors[index + 1] ?? endAnchor)
        remove(childAnchors[index])
        childAnchors.splice(index, 1)
    }

    templateEffect(() => {
        const items = collection()

        const newKeys = items.map(keyFn)
        const diff = getTransformation(currentKeys, newKeys);

        /*
            need a way to notify index update to all (changed) child
            it would be easier if we treat those child as a component
            but then we can make index i signal and
                - just make the user use index.value
                - tranpile all index call to index.value
                    we then need to do some weird shit in transpiling phase
                - [already did] make Signal::toString behave the same as signal.value.toString()
            the same go with item
                - if the user use destructuring we then need to tranpile whatever it is to item.props
                - maybe we could do $$item.{index, value} and make $$item deeply reactive
                - $.bind expect a writable signal or should i make it detect a reactive object?
            
            wait we still cant do binding for properties yet: `obj.path.to.prop` 
            so we need to generate a PROXY $.proxy(obj, `path.to.prop`) the return some
            stupid object that is compatible with Signal<T> to use with binding
            note that obj need to be deeply reactive
            {
                set(value) {
                    obj[`path`][`to`][`prop`] = value
                }
                get() {
                    return obj[`path`][`to`][`prop`] 
                }
            } 
        */

        for (const op of diff) {
            if (op.type === "insert") {
                render(op.index, op.item)
            } else if (op.type === "remove") {
                yeet(op.index)
            }
        }

        currentKeys = newKeys

        // each child will have there dispose function
    })
}
