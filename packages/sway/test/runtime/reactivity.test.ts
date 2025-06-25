import { createSignal, createEffect, createComputed, get, set } from "../../lib/runtime/reactivity/internal";

import { expect, it, test } from "vitest";

test("only Computed", () => {
    const counter = createSignal(0);
    const doubled = createComputed(() => get(counter) * 2);

    expect(get(doubled)).toBe(0);
    set(counter, 1);
    expect(get(doubled)).toBe(2);
});

test("only Effect", () => {
    const counter = createSignal(8);
    let res = 0;
    createEffect(() => {
        res = get(counter);
    });
    set(counter, 42);

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
test("Complex graph", () => {
    const a = createSignal(0);
    const b = createComputed(() => get(a) * 4 + 1);
    const c = createComputed(() => get(a) * 3 + get(b));
    const d = createComputed(() => 2 * (get(b) + get(c)));

    // a             |  3, 12
    // b = 4a + 1    | 13, 49
    // c = 3a + b    | 22, 85
    // d = 2(b + c)  | 70, 268
    let res = 0;

    createEffect(() => {
        res = get(d);
        // console.log(res);
    });

    set(a, 3);
    expect(res).toBe(70);
    set(a, 12);
    expect(res).toBe(268);
});

// idk how to test how many time the computed tun tho
// i mean i can console.log it but i dont want to export too many thing
// btw, the test above trigger a computed rerun total of 9 times which is good


test("Update batching", async () => {
    const a = createSignal(8);
    const b = createSignal(9);
    const c = createComputed(() => a.value + b.value);

    function increment() {
        set(a, get(a) + 1);
        set(b, get(b) + 1);
    }

    let rerunCount = 0;
    createEffect(() => {
        rerunCount += 1;
        console.log(get(c));
    });

    increment();
    increment();
    increment();
    await new Promise(resolve => setTimeout(resolve, 100));
    increment();

    console.log(c.value);

    expect(rerunCount).toBe(2);
});
