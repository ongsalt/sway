import * as $ from "sway/runtime"
import { ComponentContext, signal } from "sway";

const createRoots = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2"><h1 class="text-2xl">If else test</h1><p> </p><!></main><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">increment</button><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Add</button>`)

export default function Interpolation({ anchor }: ComponentContext) {
    const roots = createRoots()

    const count = signal(1)

    const p = $.children(roots[0], 1)
    const text = $.children(p)

    const button = roots[1]
    button.addEventListener('click', () => {
        count.value += 1
    })

    console.log(button)

    $.templateEffect(() => {
        $.setText(text, `${count.value}`)
    })
    $.append(anchor, roots)
}
