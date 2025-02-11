import { getTransformation } from "./array";
import { RuntimeEachScope, tuanContext } from "./scope";
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
    const endAnchor = comment("end-each");
    append(anchor, endAnchor)

    let currentKeys: Key[] = []
    let childAnchors: Comment[] = []

    function createAnchor(index: number) {
        const anchor = comment("each-child")
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
        // apply diff
        // console.log({
        //     currentKeys,
        //     newKeys,
        //     diff
        // })

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
