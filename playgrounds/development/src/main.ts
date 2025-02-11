import { mount } from "sway"

// "Click to show definitions" is handled by an extension
import Interpolation from "./components/interpolation.sway"
// import Attributes from "./components/attributes.sway"
// import { autoRetracking } from "./features/auto-retracking"
import Each from "./components/Each.sway"
import Todos from "./components/todos.sway"
import NestedControlFlow from "./components/nested-control-flow.sway"
import IfElse from "./components/if-else.sway"
import Binding from "./components/binding.sway"
import { reactiveContext } from "./features/reactive-context"
// import NestedControlFlow from "./components/nested-control-flow.generated"

const appRoot = document.getElementById("app")!

mount(Todos, appRoot)

// reactiveContext()

