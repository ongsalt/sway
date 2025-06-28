import { computed, effect, signal } from "../../lib/runtime/reactivity";
import { createComputed, createEffect, createSignal, get, set, tick } from "../../lib/runtime/reactivity/internal";

import { expect, test } from "vitest";

test("only Computed", () => {
    const counter = createSignal(0);
    const doubled = createComputed(() => get(counter) * 2);

    expect(get(doubled)).toBe(0);
    set(counter, 1);
    expect(get(doubled)).toBe(2);
});

test("only Effect", async () => {
    const counter = signal(8);
    let res = 0;
    effect(() => {
        res = counter.value;
    });
    counter.value = 42;
    await tick();
    expect(res).toBe(42);
});

test("Computed and Effect", () => {
    const counter = createSignal(32);
    const doubled = createComputed(() => get(counter) * 2);
    let res = 0;
    let runCount = 0;

    createEffect(() => {
        runCount += 1;
        res = get(counter) + get(doubled);
        // console.log(res);
    });

    set(counter, 3);
    set(counter, 12);

    expect(res).toBe(36);
    expect(runCount).toBe(3);
});

/*
     A
    / \
   B-->C
    \ /
     D
*/
test("Complex graph", async () => {
    let rerun = 0;
    const a = signal(0);
    const b = computed(() => {
        rerun += 1;
        return a.value * 4 + 1;
    });
    const c = computed(() => {
        rerun += 1;
        return a.value * 3 + b.value;
    });
    const d = computed(() => {
        rerun += 1;
        return 2 * (b.value + c.value);
    });

    // a             |  3, 12
    // b = 4a + 1    | 13, 49
    // c = 3a + b    | 22, 85
    // d = 2(b + c)  | 70, 268
    let res = 0;

    effect(() => {
        console.log(d.value);
        res = d.value;
    });

    a.value = 3;
    await tick();
    expect(res).toBe(70);
    a.value = 12;
    await tick();
    expect(res).toBe(268);
    expect(rerun).toBe(9);
});

test("Update batching", async () => {
    const a = signal(8);
    const b = signal(9);
    const c = computed(() => a.value + b.value);

    function increment() {
        a.value += 1;
        b.value += 1;
    }

    let rerunCount = 0;
    effect(() => {
        rerunCount += 1;
        console.log(c.value);
    });

    increment();
    increment();
    increment();
    await tick();

    increment();
    await tick();

    expect(rerunCount).toBe(3);
});

test("State read within the same scope that it was defined", async () => {
    effect(() => {
        const n = signal(1);

        n.value;
        n.value = Math.random();
        console.log("rerun?");
    });
    // await new Promise(resolve => setTimeout(resolve, 1000));
})

