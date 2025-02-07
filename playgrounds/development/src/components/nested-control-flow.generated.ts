/* component-declaration:  */
/* any:  */
import * as $ from 'tuan/runtime';


/* estree:  */
import { signal } from 'tuan';

/* template-root:  */
const root = $.template(`<button class="bg-teal-500 hover:bg-teal-500/95 text-white font-medium rounded-md p-2 px-4">Toggle</button><button class="bg-teal-500 hover:bg-teal-500/95 text-white font-medium rounded-md p-2 px-4">Toggle 2</button><div> <br/> </div><!>`);
/* template-root:  */
const root_1 = $.template(`<div class="border border-green-500 p-2 m-4 rounded-md">Branch 1</div>`);
/* template-root:  */
const root_2 = $.template(`<div class="border p-2 m-4 rounded-md">Branch 2</div><!>`);
/* template-root:  */
const root_3 = $.template(`<div class="border border-blue-500 p-2 m-4 rounded-md">Branch 2.A</div>`);
/* template-root:  */
const root_4 = $.template(`<div class="border border-red-500 p-2 m-4 rounded-md">Branch 2.B</div>`);

/* component-function:  */
export default function Component($$context) {
    /* create-root:  */
    const fragment = root();
    /* user-script:  */


    const show = signal(false);
    const show2 = signal(true);

    const toggle = () => {
        show.value = !show.value;
    };

    const toggle2 = () => {
        show2.value = !show2.value;
    };

    const someValue = "Hihi";


    /* accessor-definition:  */
    const button = $.children(fragment, 0);
    /* event-listener:  */
    $.listen(button, "click", toggle);
    /* accessor-definition:  */
    const button_1 = $.children(fragment, 1);
    /* event-listener:  */
    $.listen(button_1, "click", toggle2);
    /* accessor-definition:  */
    const div = $.children(fragment, 2);
    /* accessor-definition:  */
    const text = $.children(div, 0);
    /* accessor-definition:  */
    const text_1 = $.children(div, 2);
    /* accessor-definition:  */
    const anchor = $.children(fragment, 3);
    /* template-effect:  */
    $.templateEffect(() => {
        /* text-setting:  */
        $.setText(text, `show:${show.value}`)

    });
    /* template-effect:  */
    $.templateEffect(() => {
        /* text-setting:  */
        $.setText(text_1, `show2:${show2.value}`)

    });
    /* if:  */

    {
        const then = ($$anchor) => {
            /* create-root:  */
            const fragment_1 = root_1();

            $.append($$anchor, fragment_1);
        };
        const alternative_1 = ($$anchor) => {
            /* create-root:  */
            const fragment_2 = root_2();
            /* accessor-definition:  */
            const anchor_1 = $.children(fragment_2, 1);
            /* if:  */

            {
                const then_1 = ($$anchor) => {
                    /* create-root:  */
                    const fragment_3 = root_3();

                    $.append($$anchor, fragment_3);
                };
                const alternative = ($$anchor) => {
                    /* create-root:  */
                    const fragment_4 = root_4();

                    $.append($$anchor, fragment_4);
                };

                $.if(anchor_1, ($$render) => {
                    if (show2.value) $$render(then_1)
                    else $$render(alternative, false);
                });
            }

            $.append($$anchor, fragment_2);
        };

        $.if(anchor, ($$render) => {
            if (show.value) $$render(then)
            else $$render(alternative_1, false);
        });
    }
    /* append:  */
    $.append($$context.anchor, fragment);

}


