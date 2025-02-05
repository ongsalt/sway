import * as $ from "tuan/runtime"
import { ComponentContext, signal } from "tuan";

const root = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2"><h1 class="text-2xl">If else test</h1><p> </p><!></main><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Toggle</button>`)
const root_1 = $.template(`<h2>First content</h2><p>We're<br/>No stranger to love</p><p> </p>`)

export default function IfElse({ anchor }: ComponentContext) {
    const fragments = createRoots()

    const show = signal(true)
    const a = signal("skibidi")

    const toggle = () => { 
        show.value = !show.value
    } 
    // TODO: make $.children accept this too
    const p = $.children(fragments[0], 1)
    const text = $.children(p)

    const button = fragments[1]
    button.addEventListener('click', () => {
        toggle()
    })

    const anchor_1 = $.children(fragments[0], 2)
    $.if(anchor_1, () => {
        // This wll be rerun everytime show.value is change which might rewrite all of these
        // We might do same thing as svelte which is to pass $$render to track which branch get called
        if (show.value) {
            const fragments_1 = root_1()
            // ok i understand why svelte pass this around now
            $.append(anchor_1, fragments_1)
        }
    })

    $.append(anchor, roots)
}
