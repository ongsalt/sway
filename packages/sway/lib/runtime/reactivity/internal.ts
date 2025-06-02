/*

i reimplement this for like the morbillionth time now

this time we gonna
- IMPORTANT: wrap an effect in a try catch, why didn't i think of that before
- have a proper scheduler
- handle this by counting node order (or should i say depth)
     A
    / \
   B-->C
    \ /
     D

*/

import { DedupBucketPQ } from "../utils/queue";

interface Source<T = any> {
    // get(): T;
    value: T;
    subscribers: Set<Subscriber>; // performance? who care
}

interface Subscriber {
    // TODO: flag
    dirty: boolean;
    sources: Set<Source<any>>;
}

interface Signal<T = any> extends Source<T> {
    // previousValue: T // why vue do this tho
    // set(value: T): void;
}

interface Computed<T = any> extends Source<T>, Subscriber {
    fn: () => T;

    // depth: number;

    parent: EffectScope | null; // we technically dont need to do this, but gc
}

// effect shuold also Own all subscriber inside it 
interface Effect extends Subscriber, EffectScope {
    fn: () => (void | (() => void));
    priority: number;
    cleanup?: () => void;
}

// or effect owner?
interface EffectScope {
    children: Set<Subscriber | EffectScope>;
    parent: EffectScope | null;
}

type ReactiveScope = EffectScope | Effect;
type ReactiveNode = Subscriber | Source | ReactiveScope;

// TODO: scope
let activeScope: EffectScope | null = null;
let activeSubscriber: Subscriber | null = null;
const batch = new DedupBucketPQ<Effect>();
let batchNumber = 0;

export function createEffectScope(root = false): EffectScope {
    const scope: EffectScope = {
        children: new Set(),
        parent: root ? null : activeScope
    };

    if (scope.parent) {
        scope.parent.children.add(scope);
    }

    return scope;
}

export function withScope<T>(scope: EffectScope, fn: () => T) {
    const previous = activeScope;
    activeScope = scope;
    try {
        return fn();
    } catch (e) {
        throw e;
    } finally {
        activeScope = previous;
    }
}

// TODO: better overload
export function createSignal<T>(value: T): Signal<T> {
    const subscribers = new Set<Subscriber>();

    return {
        value,
        subscribers,
    };
}

// TODO: return a cleanup fn
export function createEffect(fn: () => any, priority = 1): Effect {
    const effect: Effect = {
        dirty: false,
        fn,
        sources: new Set(),
        priority,
        children: new Set(),
        parent: activeScope
    };

    if (effect.parent) {
        effect.parent.children.add(effect);
    }

    updateEffect(effect);
    return effect;
}

export function createComputed<T>(computation: () => T): Computed<T> {
    const subscribers = new Set<Subscriber>();
    const sources = new Set<Source>();

    const computed: Computed<T> = {
        value: undefined as T, // TODO: well well well
        sources,
        dirty: true,
        subscribers,
        fn: computation,
        parent: activeScope
        // depth: 0
    };

    if (computed.parent) {
        computed.parent.children.add(computed);
    }

    return computed;
}

function notify(subscriber: Subscriber, depth = 0) {
    if ("value" in subscriber) {
        notifyComputed(subscriber as Computed, depth);
    } else {
        notifyEffect(subscriber as Effect);
    }
}

function notifyEffect(effect: Effect) {
    // eagerly run it

    // we should start a new batch after a set call
    // TODO: schedule these then batchNumber += 1
    //       so a state set in an effect will run after this 
    batch.insert(effect, effect.priority);
}

function notifyComputed(computed: Computed, depth = 0) {
    computed.dirty = true;
    // computed.depth = Math.max(computed.depth, depth);
    for (const subscriber of computed.subscribers) {
        notify(subscriber);
    }
}

function updateEffect(effect: Effect) {
    const previous = activeSubscriber;
    activeSubscriber = effect;

    for (const source of effect.sources) {
        unlink(source, effect);
    }

    // it will be auto link again when rerun
    runCleanup(effect);

    try {
        effect.cleanup = effect.fn() as any; // fuck ts
        effect.dirty = false;
    } catch (e) {
        console.error("[Effect]", e);
    } finally {
        activeSubscriber = previous;
    }
}

function updateComputed(computed: Computed) {
    // console.log("updating")
    const previous = activeSubscriber;
    activeSubscriber = computed;
    // computed.depth = 0; // reset it

    for (const source of computed.sources) {
        unlink(source, computed);
    }

    // it will be auto link again when rerun
    try {
        computed.value = computed.fn();
        computed.dirty = false;
    } catch (e) {
        console.error("[Computed]", e);
    } finally {
        activeSubscriber = previous;
    }
}

function flush() {
    // TODO: sort this by priority
    // sorted set based on a link listed for this? 
    // console.log(`batchNumber: ${batchNumber}`);
    for (const effect of batch.flush()) {
        updateEffect(effect);
    }
    // batchNumber += 1;
}

function link(source: Source, subscriber: Subscriber) {
    source.subscribers.add(subscriber);
    subscriber.sources.add(source);
}

function unlink(source: Source, subscriber: Subscriber) {
    source.subscribers.delete(subscriber);
    subscriber.sources.delete(source);
}

export function get<T>(source: Source<T>) {
    if (activeSubscriber) {
        link(source, activeSubscriber);
    }

    if ("dirty" in source) {
        const c = source as Computed;
        if (c.dirty) {
            updateComputed(c);
        }
    }

    return source.value;
}

export function set<T>(signal: Signal<T>, value: T) {
    signal.value = value;
    // start a batch
    for (const subscriber of signal.subscribers) {
        notify(subscriber);
    }
    flush();
}

function runCleanup(effect: Effect) {
    try {
        effect.cleanup?.();
    } catch (e) {
        console.error("[destroy Effect cleanup]", e);
    } finally {
        effect.cleanup = undefined;
    }
}

export function destroy(node: ReactiveNode) {
    if ("cleanup" in node) {
        runCleanup(node);
    }

    if ("subscribers" in node) {
        for (const subscriber of node.subscribers) {
            unlink(node, subscriber);
        }
    }

    if ("sources" in node) {
        for (const source of node.sources) {
            unlink(source, node);
        }
    }

    if ("children" in node) {
        for (const subscriber of node.children) {
            destroy(subscriber);
        }
        // remove self from parent node
        node.parent?.children.delete(node);
    }
}

