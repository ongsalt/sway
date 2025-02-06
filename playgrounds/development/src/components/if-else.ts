import * as $ from "tuan/runtime"
import { ComponentContext, signal } from "tuan";


// This is handwrited to test the runtime. 

const root = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2"><h1 class="text-2xl">If else test</h1><p> </p><!></main><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">increase</button><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">decrease</button>`)
const root_1 = $.template(`<h2>First content</h2><p>We're<br/>No stranger to love</p><p> </p>`)

export default function IfElse({ anchor }: ComponentContext) {
    const fragments = root()

    const count = signal(1)
    const a = signal(1)
    setInterval(() => {
        a.value += 1
    }, 1000)

    const increment = () => { 
        count.value += 1
    } 
    const decrement = () => { 
        count.value -= 1
    }
    
    // TODO: make $.children accept Node[] too
    const p = $.children(fragments[0], 1)
    const text = $.children(p)

    $.templateEffect(() => {
        $.setText(text, `${count.value}`)
    })

    const button = fragments[1]
    button.addEventListener('click', () => {
        increment()
    })

    const button_1 = fragments[2]
    button_1.addEventListener('click', () => {
        decrement()
    })

    const anchor_1 = $.children(fragments[0], 2);
    
    {   
        const consequent: $.RenderFn = ($$anchor) => {
            const fragments_1 = root_1();
            const p_1 = fragments_1[2];
            const text_1 = $.children(p_1)

            $.templateEffect(() => {
                $.setText(text_1, `${a.value}`)
                console.log(p_1)
            })
            // ok i understand why svelte pass this around now
            $.append($$anchor, fragments_1)
        }

        $.if(anchor_1, ($$render) => {
            // This wll be rerun everytime show.value is change which might rewrite all of these
            // We might do same thing as svelte which is to pass $$render to track which branch get called
            if (count.value < 5) $$render(consequent);
        })
    }

    $.append(anchor, fragments)
}
