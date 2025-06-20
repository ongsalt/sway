import * as $ from "sway/runtime";


import {
  ComponentContext,
  reactive,
  signal
} from "sway";

const template = $.template(`<main class="m-8 border rounded-lg shadow-sm p-6 space-y-8"><div><h1 class="text-2xl">Todo list</h1></div><div class="gap-2 flex flex-col"><label for="description">Description</label><input type="text" class="border rounded-md shadow-sm p-2 px-4" placeholder="Type something..."/><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Add todo</button></div><!></main><div class="border rounded-lg bg-neutral-100 m-8 overflow-clip"><div class="p-4 bg-white border-b shadow-sm flex gap-2"><h3 class="font-medium">JSON</h3></div><p class="p-4"> </p></div>`);
const template_1 = $.template(`<div class="border rounded-md p-4"><span> </span><!><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white"> </button><button class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white">Remove</button></div>`);
const template_2 = $.template(`<div><input type="text" class="border rounded-md shadow-sm p-2 px-4" placeholder="Type something..."/></div>`);
const template_3 = $.template(`<p class=""> </p>`);

export default function TodosArrayPatching($$context: ComponentContext) {
  let id = 12768;

  const todos = reactive([
    {
      id: id++,
      description: "lorem",
      editing: false,
    },
  ]);

  function remove2(index: number) {
    return () => {
      const [removed] = todos.splice(index, 1);
      console.log(`removing todo number ${index}`, removed);
      // console.log("raw", raw(todos))
    };
  }

  const description = signal("");

  function addTodo() {
    todos.push({
      id: id++,
      description: description.value,
      editing: false,
    });
    // console.log(todos)
    description.value = "";
  }

  function toggleEdit(todo) {
    todo.editing = !todo.editing;
    // TODO: make this NOT run immediately
    console.log(todo);
  }


  const root_fragment = template();
  const main = $.children(root_fragment, 0);
  const div = $.children(main, 0);
  const h1 = $.children(div, 0);
  const div_1 = $.children(main, 1);
  const label = $.children(div_1, 0);
  
  const input = $.children(div_1, 1);
  $.bind(input, `value`, () => description.value, ($$value) => (description.value = $$value));
  const button = $.children(div_1, 2);
  $.listen(button, "click", () => addTodo);
  
  const each_anchor = $.children(main, 2);
  $.each(each_anchor, () => todos, ($$anchor, todo, index) => {
    const each_fragment = template_1();
    const div_2 = $.children(each_fragment, 0);
    const span = $.children(div_2, 0);
    const text = $.children(span, 0);
    $.templateEffect(() => {
      $.setText(text, `index: ${index.value}, id: ${todo.id}`);

    });
    const if_anchor = $.children(div_2, 1);

    {
      const then = ($$anchor) => {
        const if_fragment = template_2();
        const div_3 = $.children(if_fragment, 0);
        const input_1 = $.children(div_3, 0);
        $.bind(input_1, `value`, () => todo.description, ($$value) => (todo.description = $$value));

        $.append($$anchor, if_fragment);
      };
      const alternative = ($$anchor) => {
        const else_fragment = template_3();
        const p = $.children(else_fragment, 0);
        const text_1 = $.children(p, 0);
        $.templateEffect(() => {
          $.setText(text_1, `${todo.description}`);

        });

        $.append($$anchor, else_fragment);
      };

      $.if(if_anchor, ($$render) => {
        if (todo.editing) $$render(then);
        else $$render(alternative, false);
      });
    }
    const button_1 = $.children(div_2, 2);
    $.listen(button_1, "click", () => () => toggleEdit(todo));
    const text_2 = $.children(button_1, 0);
    $.templateEffect(() => {
      $.setText(text_2, `${todo.editing ? "Done" : "Edit"}`);

    });
    const button_2 = $.children(div_2, 3);
    $.listen(button_2, "click", () => remove2(index.value));

    $.append($$anchor, each_fragment);
  });

  const div_4 = $.children(root_fragment, 1);
  const div_5 = $.children(div_4, 0);
  const h3 = $.children(div_5, 0);
  const p_1 = $.children(div_4, 1);
  const text_3 = $.children(p_1, 0);

  $.templateEffect(() => {
    $.setText(text_3, `${JSON.stringify(todos)}`);

  });
  $.append($$context.anchor, root_fragment);
}

