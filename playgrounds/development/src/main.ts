import { mount } from "sway";
// import Todos from "./components/todos.sway"
// import PropsParent from "./components/props-parent.sway";
import SignalBatching from "./components/signal-batching.sway";

const appRoot = document.getElementById("app")!;

mount(SignalBatching, {
  root: appRoot,
  props: {},
});

