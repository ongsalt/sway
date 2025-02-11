import { mount } from "sway"

// "Click to show definitions" is handled by an extension
// import Attributes from "./components/attributes.sway"
// import { autoRetracking } from "./features/auto-retracking"
import Todos from "./components/todos.sway"
// import NestedControlFlow from "./components/nested-control-flow.generated"

const appRoot = document.getElementById("app")!

mount(Todos, appRoot)

// reactiveContext()

