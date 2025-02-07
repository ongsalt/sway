import { CleanupFn, computed, effect, templateEffect, trackEffect } from "../signal";
import { getTransformation, Operation } from "./array";
import { CurrentEach, tuanContext } from "./context";
import { append, comment, remove, sweep, trackAppending } from "./dom";
import { identity } from "./utilities";

// any thing that can be compared
type Key = any
type KeyFn<T> = (value: T) => Key


export function each<Item>(
    anchor: Node,
    collection: () => Item[],
    children: (anchor: Node, value: Item, index: number) => void,
    keyFn: KeyFn<Item> = identity // use object reference as key
) {
    const previous = tuanContext.currentScope;
    const scope: CurrentEach = {
        type: "each",
        previous,
        cleanups: [],
    }

    const endAnchor = comment("end-each");
    append(anchor, endAnchor)

    type ChildContext = {
        cleanups: CleanupFn[],
        anchor: Comment
    }

    let currentKeys: Key[] = []
    let childContexts: ChildContext[] = []

    function createAnchor(index: number) {
        const c = comment("each")
        // We need a way to put anchor at any arbitary index
        if (index >= childContexts.length) {
            append(endAnchor, c, true)
        } else {
            append(childContexts[index].anchor, c, true)
        }
        return c
    }

    function render(index: number, item: Item) {
        const anchor = createAnchor(index)

        let disposeEffect = trackEffect(() => {
            tuanContext.currentScope = scope
            children(anchor, item, index)
            tuanContext.currentScope = previous;
        })
        const context: ChildContext = {
            cleanups: [disposeEffect!],
            anchor
        }


        childContexts.splice(index, 0, context)
    }

    function yeet(index: number) {
        const childContext = childContexts[index]
        childContext.cleanups.forEach(fn => fn())
        sweep(childContext.anchor, childContexts[index + 1]?.anchor ?? endAnchor)
        remove(childContext.anchor)
        childContexts.splice(index, 1)
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
