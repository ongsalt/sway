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

    depth: number;
}

// effect shuold also Own all subscriber inside it 
interface Effect extends Subscriber {
    fn: () => any;
    priority: number;

    // scope member
    members: Set<Subscriber>;
}

// or effect owner?
interface EffectScope {
    members: Set<Subscriber>;
}

type ReactiveScope = EffectScope | Effect;
type ReactiveNode = Subscriber | Source;

// TODO: create test for reactivity

let activeScope: EffectScope | null = null;
let activeSubscriber: Subscriber | null = null;
const batch = new Set<Effect>();
let batchNumber = 0;

export function createEffectScope(): EffectScope {
    const members = new Set<Subscriber>();
    const scope: EffectScope = {
        members,
    };

    return scope;
}

export function disposeScope(scope: EffectScope) {
    scope.members.forEach(s => destroy(s));
}

export function withScope<T>(scope: EffectScope, fn: () => T) {
    const previous = activeScope;
    activeScope = scope;
    try {
        return fn();
    } catch (e) {
        // TODO: capture stack
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

// TODO: cleanup hell
export function createEffect(fn: () => any, priority = 1): Effect {
    // WE NEED TO RUN IT
    const effect: Effect = {
        dirty: false,
        fn,
        sources: new Set(),
        priority,
        members: new Set()
    };

    updateEffect(effect);

    return effect;
}

export function createComputed<T>(computation: () => T): Computed<T> {
    const subscribers = new Set<Subscriber>();
    const sources = new Set<Source>();

    return {
        value: undefined as T, // TODO: well well well
        sources,
        dirty: true,
        subscribers,
        fn: computation,
        depth: 0
    };
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
    batch.add(effect);
}

function notifyComputed(computed: Computed, depth = 0) {
    computed.dirty = true;
    computed.depth = Math.max(computed.depth, depth);
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
    try {
        effect.fn();
        effect.dirty = false;
    } catch (e) {
        console.error("[Effect]", e);
    } finally {
        activeSubscriber = previous;
    }
}

function updateComputed(computed: Computed) {
    const previous = activeSubscriber;
    activeSubscriber = computed;
    computed.depth = 0; // reset it

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
    // use a link listed for this?
    // console.log(`batchNumber: ${batchNumber}`);
    for (const effect of batch) {
        updateEffect(effect);
    }
    batch.clear();
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
            // retrack
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

export function destroy(node: ReactiveNode) {
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
}

