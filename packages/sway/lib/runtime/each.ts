import { effectScope, EffectScope, signal, Signal, templateEffect } from "./reactivity";
import { SwayRuntime } from "./internal";
import { getTransformation } from "./utils/array";
import { identity } from "./utils/functions";

/*
basically this
- svelte prevent us from doing `each ... as { name , id }` and use input binding on `name`
  which is very reasonable BUT they did allow it pre rune mode.

<script>
    let cats = $state([
        { id: 'J---aiyznGQ', name: 'Keyboard Cat' },
        { id: 'z_AbfPXTKms', name: 'Maru' },
        { id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' },
        { id: 'asd', name: 'Doraemon' },
        { id: 'heil', name: 'Kitler' },
    ]);

    let lenght = $state(7)
</script>

<h1>cats</h1>
<input bind:value={lenght}/>
<ul>
    {#each cats.filter(it => it.id.length < lenght) as cat, i}
        <li>
            <input bind:value={cat.name}/>
        </li>
    {/each}
</ul>

well we cant parse that yet
*/

// any thing that can be compared
type Key = any;
type KeyFn<T> = (value: T) => Key;

// look kinda pain in the ass to do this
export function each<Item, HostNode>(
    runtime: SwayRuntime<HostNode, any, any>,
    anchor: HostNode,
    collection: () => Item[],
    children: (anchor: HostNode, value: Item, index: Signal<number>) => void,
    keyFn: KeyFn<Item> = identity // use object reference as key
) {
    const eachAnchor = anchor;
    const endAnchor = runtime.comment();
    runtime.append(eachAnchor, endAnchor);

    let currentKeys: Key[] = [];
    type ChildrenContext = {
        anchor: HostNode,
        endAnchor: HostNode,
        index: Signal<number>,
        scope: EffectScope;
    };
    let childrenContexts: ChildrenContext[] = [];

    function createContext(index: number): ChildrenContext {
        const anchor = runtime.comment();
        const endAnchor = runtime.comment();
        // We need a way to put anchor at any arbitary index
        if (index === 0) {
            runtime.append(eachAnchor, anchor);
        } else {
            runtime.append(childrenContexts[index - 1].endAnchor, anchor);
        }
        runtime.append(anchor, endAnchor);
        const context: ChildrenContext = {
            anchor,
            endAnchor,
            index: signal(index),
            scope: effectScope()
        };
        childrenContexts.splice(index, 0, context);
        return context;
    }

    function render(index: number, item: Item) {
        const context = createContext(index);
        // we should start new effect context to prevent auto cleanup
        context.scope.run(() => {
            children(context.anchor, item, context.index);
        });
    }

    function yeet(index: number) {
        const context = childrenContexts[index];
        context.scope.destroy();
        runtime.sweep(context.anchor, context.endAnchor);
        runtime.remove(context.anchor);
        runtime.remove(context.endAnchor);
        childrenContexts.splice(index, 1);
    }

    function notifyOrderChange() {
        childrenContexts.forEach((context, index) => {
            if (context.index.value !== index) {
                context.index.value = index;
            }
        });
    }

    templateEffect(() => {
        const items: Item[] = [];
        const _items = collection();

        for (let i = 0; i < _items.length; i++) {
            items.push(_items[i]); // this is to create linked proxy 
        }
        // console.log(`[each] rerun`, _items);

        // we at least for now, cant determine if items is writable or not
        // so fuck it, everything is writable now
        // and now that Signal return a proxy by default now
        // but now object reference comparison is fucked up

        // todo: dont key thing unless explicitly stated
        // TODO: optimize diffing
        const newKeys = items.map(keyFn);
        const itemMap = new Map<any, Item>();
        for (let i = 0; i < newKeys.length; i++) {
            if (itemMap.has(newKeys[i])) {
                throw new Error(`Duplicate key ${newKeys[i]}`);
            }
            itemMap.set(newKeys[i], items[i]);
        }

        const diff = getTransformation(currentKeys, newKeys);
        // if (!diff.length) {
        //     return;
        // }
        // console.log({
        //     diff,
        //     currentKeys,
        //     newKeys
        // });

        // TODO: in fact we could have just swap the data props
        //       and keep the node only if key is provided
        for (const op of diff) {
            if (op.type === "insert") {
                const item = itemMap.get(op.item)!;
                render(op.index, item);
            } else if (op.type === "remove") {
                yeet(op.index);
            }
        }

        notifyOrderChange();
        currentKeys = newKeys;

        // each child will have there dispose function
    });
}
