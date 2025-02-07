import { computed, effect, templateEffect } from "../signal";
import { getTransformation, Operation } from "./array";
import { CurrentEach, tuanContext } from "./context";
import { append, comment, remove } from "./dom";
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
        nodes: new Set()
    }

    const childAnchors: Comment[] = [] // their size should match
    const currentKeys: Key[] = []

    function reconcileAnchors(amount: number) {
        while (childAnchors.length > amount) {
            const anchor = childAnchors.pop()!
            remove(anchor)
        }

        while (childAnchors.length < amount) {
            const c = comment("each")
            childAnchors.push(c)
            append(anchor, c)
        }
    }

    templateEffect(() => {
        const items = collection()

        const newKeys = items.map(keyFn)
        const diff = getTransformation(currentKeys, newKeys);
        // apply diff

        reconcileAnchors(newKeys.length)
        items.forEach((item, index) => {
            // each children should have their own anchor
            const shouldRender = true;
            if (shouldRender) {
                tuanContext.currentScope = scope
                children(childAnchors[index], item, index)
                tuanContext.currentScope = previous
            }
        })


        // each child will have there dispose function
    })
}
