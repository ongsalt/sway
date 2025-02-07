import { computed, effect, templateEffect } from "../signal";
import { identity } from "./utilities";

// any thing that can be compared
type Key = any
type KeyFn<T> = (value: T) => Key

export function each<Item>(
    anchor: Node,
    collection: () => Item[],
    children: (anchor: Node, value: Item) => void,
    keyFn: KeyFn<Item> = identity
) {
    const currentKeys: Key[] = []

    templateEffect(() => {
        const items = collection()

        const newKeys = items.map(keyFn)
    })
}
