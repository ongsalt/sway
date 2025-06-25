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

export interface Source<T = any> {
    // get(): T;
    value: T;
    subscribers: Set<Subscriber>; // performance? who care
}

export interface Subscriber {
    dirty: boolean;
    sources: Set<Source<any>>;
}

export interface Signal<T = any> extends Source<T> {
    // previousValue: T // why vue do this tho
    // set(value: T): void;
}

export interface Computed<T = any> extends Source<T>, Subscriber {
    fn: () => T;

    // depth: number;

    parent: EffectScope | null; // we technically dont need to do this, but gc
}

export type Cleanup = () => any;
export type EffectFn = () => (void | Cleanup);
// effect shuold also Own all subscriber inside it 
export interface Effect extends Subscriber, EffectScope {
    fn: EffectFn;
    priority: number;
    cleanups: Cleanup[];
}

// or effect owner?
export interface EffectScope {
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

export function getActiveScope() {
    return activeScope;
}

export function addToScope(scope: EffectScope, subscriber: Subscriber | EffectScope) {
    scope.children.add(subscriber);
}

export function createEffectScope(root = false): EffectScope {
    const scope: EffectScope = {
        children: new Set(),
        parent: root ? null : activeScope
    };

    if (scope.parent) {
        addToScope(scope.parent, scope);
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

export function createEffect(fn: EffectFn, priority = 1): Effect {
    // TODO: shuold we defer effect first run to after component initialization
    const effect: Effect = {
        dirty: false,
        fn,
        sources: new Set(),
        priority,
        children: new Set(),
        parent: activeScope,
        cleanups: []
    };

    if (effect.parent) {
        addToScope(effect.parent, effect);
    }

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
        addToScope(computed.parent, computed);
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

export function updateEffect(effect: Effect) {
    const previous = activeSubscriber;
    activeSubscriber = effect;

    for (const source of effect.sources) {
        unlink(source, effect);
    }

    // it will be auto link again when rerun
    runCleanup(effect);

    try {
        const cleanup = effect.fn(); // fuck ts
        if (typeof cleanup === "function") {
            effect.cleanups.push(cleanup);
        }
        effect.dirty = false;
    } catch (e) {
        console.error("[Effect]", e);
    } finally {
        activeSubscriber = previous;
    }
}

export function updateComputed(computed: Computed) {
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

export function trigger(signal: Signal<any>) {
    // start a batch
    for (const subscriber of signal.subscribers) {
        notify(subscriber);
    }
    scheduleFlush();
}

let willFlush = false;
function scheduleFlush() {
    if (willFlush) {
        return;
    }
    queueMicrotask(() => flush());
    willFlush = true;
}

function flush() {
    // console.log(`batchNumber: ${batchNumber}`);
    for (const effect of batch.flush()) {
        updateEffect(effect);
    }

    // batchNumber += 1;

    for (const fn of afterFlushes) {
        fn();
    }

    afterFlushes = [];
    willFlush = false;
}

export function set<T>(signal: Signal<T>, value: T) {
    signal.value = value;
    // start a batch
    trigger(signal);
}

function runCleanup(effect: Effect) {
    try {
        effect.cleanups.forEach(fn => fn());
    } catch (e) {
        console.error("[destroy Effect cleanup]", e);
    } finally {
        effect.cleanups = [];
    }
}

export function destroy(node: ReactiveNode) {
    if ("cleanups" in node) {
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

export function untrack<T>(fn: () => T) {
    const p1 = activeScope;
    const p2 = activeSubscriber;
    activeScope = null;
    activeSubscriber = null;
    try {
        return fn();
    } catch (e) {
        console.error("untrack", e);
        throw e;
    } finally {
        activeScope = p1;
        activeSubscriber = p2;
    }
}

let afterFlushes: (() => any)[] = [];

export function tick() {
    const { promise, resolve } = Promise.withResolvers<void>();
    afterFlushes.push(resolve);
    return promise;
}
