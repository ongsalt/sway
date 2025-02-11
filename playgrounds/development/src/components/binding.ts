import * as $ from 'sway/runtime';


/* estree:  */
import { ComponentContext, signal } from 'sway';

/* template-root:  */
const root = $.template(`<main  class="m-8 border rounded-lg shadow-sm p-6 space-y-2"><h1  class="text-2xl">Binding test</h1><div  class="text-center  border rounded bg-slate-50 p-6 flex flex-col"><span  class="opacity-60">Your text</span><span  class="text-5xl"> </span></div><input  type="text" class="border rounded-md shadow-sm p-2 px-4" placeholder="Type something..."/><h2  class="text-xl">based on text lenght</h2><div  class="border bg-slate-50 rounded p-4"><!></div></main>`);
/* template-root:  */
const root_1 = $.template(`<h2 >First content</h2><p >We're no strangers to love</p><p > </p>`);
/* template-root:  */
const root_2 = $.template(`<h2 >Second content</h2><p >Multi root</p>`);

/* component-function:  */
export default function Component($$context: ComponentContext) {
    /* create-root:  */
    const fragment = root();
    /* user-script:  */


    const text = signal("Test");


    /* accessor-definition:  */
    const main = $.children(fragment, 0);
    /* accessor-definition:  */
    const div = $.children(main, 1);
    /* accessor-definition:  */
    const span = $.children(div, 1);
    /* accessor-definition:  */
    const text_1 = $.children(span, 0);
    /* accessor-definition:  */
    const div_1 = $.children(main, 4);
    /* accessor-definition:  */
    const anchor = $.children(div_1, 0);
    /* template-effect:  */
    $.templateEffect(() => {
        /* text-setting:  */
        $.setText(text_1, `${text.value}`)

    });

    const input = $.children(main, 2);
    $.bind(input, "value", text)
    /* if:  */

    {
        const then: $.RenderFn = ($$anchor) => {
            /* create-root:  */
            const fragment_1 = root_1();
            /* accessor-definition:  */
            const p = $.children(fragment_1, 2);
            /* accessor-definition:  */
            const text_2 = $.children(p, 0);
            /* template-effect:  */
            $.templateEffect(() => {
                /* text-setting:  */
                $.setText(text_2, `${text.value.length}`)

            });

            $.append($$anchor, fragment_1);
        };
        const alternative: $.RenderFn = ($$anchor) => {
            /* create-root:  */
            const fragment_2 = root_2();
            $.append($$anchor, fragment_2);
        };

        $.if(anchor, ($$render) => {
            if (Math.floor(text.value.length / 2) % 2 === 0) $$render(then)
            else $$render(alternative, false);
        });
    }
    /* append:  */
    $.append($$context.anchor, fragment);

}

