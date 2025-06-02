import { append, comment, remove, sweep } from "./dom";
import { effectScope, EffectScope, signal, Signal, templateEffect } from "./reactivity";
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

*/

// any thing that can be compared
type Key = any;
type KeyFn<T> = (value: T) => Key;

// look kinda pain in the ass to do this
export function each<Item>(
    anchor: Node,
    collection: () => Item[],
    children: (anchor: Node, value: Item, index: Signal<number>) => void,
    keyFn: KeyFn<Item> = identity // use object reference as key
) {
    const endAnchor = comment();
    append(anchor, endAnchor);

    let currentKeys: Key[] = [];
    type ChildrenContext = {
        anchor: Node,
        index: Signal<number>,
        scope: EffectScope;
    };
    let childrenContexts: ChildrenContext[] = [];

    function createContext(index: number): ChildrenContext {
        const anchor = comment();
        // We need a way to put anchor at any arbitary index
        if (index >= childrenContexts.length) {
            append(endAnchor, anchor, true);
        } else {
            append(childrenContexts[index].anchor, anchor, true);
        }
        const context: ChildrenContext = {
            anchor,
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
        sweep(childrenContexts[index].anchor, childrenContexts[index + 1]?.anchor ?? endAnchor);
        remove(childrenContexts[index].anchor);
        childrenContexts[index].scope.destroy();
        childrenContexts.splice(index, 1);
    }

    function notifyOrderChange() {
        childrenContexts.forEach((context, index) => {
            context.index.value = index;
        });
    }

    templateEffect(() => {
        console.log('[each] rerun');
        const items = collection();

        // we cant reassign to item???
        // ok svelte also do not allow this
        // TODO: throw an error

        // we at least for now, cant determine if items is writable or not
        // so fuck it, everything is writable now
        // and now that Signal return a proxy by default now
        // but now object reference comparison is fucked up

        // then binding is fucking broken

        const newKeys = items.map(keyFn);
        const diff = getTransformation(currentKeys, newKeys);

        // TODO: in fact we could have just swap the data props
        //       and keep the node only if key is provided
        for (const op of diff) {
            if (op.type === "insert") {
                render(op.index, op.item);
            } else if (op.type === "remove") {
                yeet(op.index);
            }
        }

        notifyOrderChange();
        // console.log({ childrenContexts })

        currentKeys = newKeys;

        // each child will have there dispose function
    });
}
