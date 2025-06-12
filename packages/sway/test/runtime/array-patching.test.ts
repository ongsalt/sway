import { test } from "vitest";
import { reactive, signal, effect } from "../../lib/runtime/reactivity";

test("reactive array patching", () => {
  let id = 0;

  const todos = reactive([
    {
      id: id++,
      description: "lorem",
    },
  ]);

  function remove(index) {
    const [removed] = todos.splice(index, 1);
    console.log(`removing todo number ${index}`, removed);
    // console.log("raw", raw(todos))
  }

  function addTodo(description: string) {
    todos.push({
      id: id++,
      description,
    });
  }

  // effect(() => {
  //   todos.length;
  //   console.log(todos);
  // });

  effect(() => {
    console.log(todos[0]);
  });


  addTodo("1288");

  remove(0);

});