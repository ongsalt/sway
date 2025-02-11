/* component-declaration:  */
/* any:  */
import * as $ from 'sway/runtime';


/* estree:  */
import {
    signal,
    computed,
    effect
} from 'sway';

/* template-root:  */
const root = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2"><h1 class="text-2xl">If else test</h1><p> </p><!><button>+</button><button>-</button></main>`);
/* template-root:  */
const root_1 = $.template(`<h2>First content</h2><p>We're no strangers to</p><p> </p>`);
/* template-root:  */
const root_2 = $.template(`<h2>Second content</h2><p> </p><p>Multi root</p>`);

/* component-function:  */
export default function Component($$context) {
    /* create-root:  */
    const fragment = root();
    /* user-script:  */


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


    /* accessor-definition:  */
    const main = $.children(fragment, 0);
    /* accessor-definition:  */
    const p = $.children(main, 1);
    /* accessor-definition:  */
    const text = $.children(p, 0);
    /* template-effect:  */
    $.templateEffect(() => {
        /* text-setting:  */
        $.setText(text, `${count.value}`)

    });
    /* accessor-definition:  */
    const anchor = $.children(main, 2);
    /* if:  */

    {
        const then = ($$anchor) => {
            /* create-root:  */
            const fragment_1 = root_1();
            /* accessor-definition:  */
            const p_1 = $.children(fragment_1, 2);
            /* accessor-definition:  */
            const text_1 = $.children(p_1, 0);
            /* template-effect:  */
            $.templateEffect(() => {
                /* text-setting:  */
                $.setText(text_1, `${a.value}`)

            });

            $.append($$anchor, fragment_1);
        };
        const alternative = ($$anchor) => {
            /* create-root:  */
            const fragment_2 = root_2();
            /* accessor-definition:  */
            const p_2 = $.children(fragment_2, 1);
            /* accessor-definition:  */
            const text_2 = $.children(p_2, 0);
            /* template-effect:  */
            $.templateEffect(() => {
                /* text-setting:  */
                $.setText(text_2, `${a.value}`)

            });

            $.append($$anchor, fragment_2);
        };

        $.if(anchor, ($$render) => {
            if (a.value < 5) $$render(then)
            else $$render(alternative);
        });
    }
    /* append:  */
    $.append($$context.anchor, fragment);

}