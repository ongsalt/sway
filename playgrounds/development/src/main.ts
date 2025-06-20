import { mount } from "sway";

// "Click to show definitions" is handled by an extension

import Attributes from "./components/attributes.sway";
// import { autoRetracking } from "./features/auto-retracking"
// import Todos from "./components/todos.sway"
import Todos from "./components/todos-array-patching.sway";
// import Todos from "./components/todos.generated"
// import NestedControlFlow from "./components/nested-control-flow.sway";
// import Binding from "./components/binding.sway";
// import DeepReactivity from "./components/deep-reactivity.sway";
import EachFiltered from "./components/each-filtered.sway";

const appRoot = document.getElementById("app")!;

// mount(DeepReactivity, appRoot)
// mount(Todos, appRoot)
mount(Attributes, appRoot);
// mount(NestedControlFlow, appRoot);
// mount(EachFiltered, appRoot)
