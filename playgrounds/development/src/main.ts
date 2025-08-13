import { mount } from "sway/runtime/dom";
import Todos from "./components/todos-array-patching.sway"
// import PropsParent from "./components/props-parent.sway";
// import SignalBatching from "./components/signal-batching.sway";

const appRoot = document.getElementById("app")!;

mount(Todos, {
  root: appRoot,
  props: {},
});

