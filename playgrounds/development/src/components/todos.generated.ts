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
const root = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-8"><div><h1 class="text-2xl">Todo list</h1><p>index is not reactive yet</p></div><div class="gap-2 flex flex-col"><label for="title">Title</label><input type="text" class="border rounded-md shadow-sm p-2 px-4" placeholder="Type something..."/><label for="description">Description</label><input type="text" class="border rounded-md shadow-sm p-2 px-4" placeholder="Type something..."/><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Add todo</button></div><!></main>`);
/* template-root:  */
const root_1 = $.template(`<div class="border rounded-md p-4"><span> </span><h2 class="font-bold text-xl"> </h2><p class=""> </p><p class="opacity-50"> </p><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Remove</button></div>`);

/* component-function:  */
export default function Component($$context) {
    $.push()
    /* create-root:  */
    const fragment = root();
    /* user-script:  */


    let id = 12768;

    const todos = signal([
        {
            id: id++,
            title: "Title",
            description: "lorem",
            createdAt: new Date(),
        },
    ]);

    function remove(todo) {
        return () => {
            todos.value = todos.value.filter((it) => it !== todo);
            console.log(`Removing ${todo}`);
        };
    }

    const title = signal("");
    const description = signal("");

    function addTodo() {
        todos.value = [
            ...todos.value,
            {
                id: id++,
                title: title.value,
                description: description.value,
                createdAt: new Date(),
            },
        ];
        title.value = "";
        description.value = "";
    }


    /* accessor-definition:  */
    const main = $.children(fragment, 0);
    /* accessor-definition:  */
    const div = $.children(main, 1);
    /* accessor-definition:  */
    const input = $.children(div, 1);
    /* binding:  */
    $.bind(input, `value`,   /* proxy:  */
        $.proxy(title, `value`))
    /* accessor-definition:  */
    const input_1 = $.children(div, 3);
    /* binding:  */
    $.bind(input_1, `value`,   /* proxy:  */
        $.proxy(description, `value`))
    /* accessor-definition:  */
    const button = $.children(div, 4);
    /* event-listener:  */
    $.listen(button, "click", addTodo);
    /* accessor-definition:  */
    const anchor = $.children(main, 2);
    /* each:  */
    $.each(anchor, () => todos.value, ($$anchor, todo, index) => {
        /* create-root:  */
        const fragment_1 = root_1();
        /* accessor-definition:  */
        const div_1 = $.children(fragment_1, 0);
        /* accessor-definition:  */
        const span = $.children(div_1, 0);
        /* accessor-definition:  */
        const text = $.children(span, 0);
        /* accessor-definition:  */
        const h2 = $.children(div_1, 1);
        /* accessor-definition:  */
        const text_1 = $.children(h2, 0);
        /* accessor-definition:  */
        const p = $.children(div_1, 2);
        /* accessor-definition:  */
        const text_2 = $.children(p, 0);
        /* accessor-definition:  */
        const p_1 = $.children(div_1, 3);
        /* accessor-definition:  */
        const text_3 = $.children(p_1, 0);
        /* accessor-definition:  */
        const button_1 = $.children(div_1, 4);
        /* event-listener:  */
        $.listen(button_1, "click", remove(todo));
        /* template-effect:  */
        $.templateEffect(() => {
            /* text-setting:  */
            $.setText(text, `index: ${index.value}, id: ${todo.id}`)

        });
        /* template-effect:  */
        $.templateEffect(() => {
            /* text-setting:  */
            $.setText(text_1, `${todo.title}`)

        });
        /* template-effect:  */
        $.templateEffect(() => {
            /* text-setting:  */
            $.setText(text_2, `${todo.description}`)

        });
        /* template-effect:  */
        $.templateEffect(() => {
            /* text-setting:  */
            $.setText(text_3, `${todo.createdAt}`)

        });

        $.append($$anchor, fragment_1);
    });
    /* append:  */
    $.append($$context.anchor, fragment);

    $.pop()
}

