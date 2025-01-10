import { effect, signal } from "tuan";

export function autoRetracking() {
    const a = signal(0);
    const b = signal(false);

    setInterval(() => {
        a.value += 1
    }, 100)

    setInterval(() => {
        b.value = !b.value
    }, 1000)

    effect(() => {
        if (b.value) {
            console.log(`a: s${a.value}`)
        }
    })
}