import { mount } from "tuan"

// "Click to show definitions" is handled by an extension
// import Interpolation from "./components/interpolation.tuan"
// import Attributes from "./components/attributes.tuan"
// import { autoRetracking } from "./features/auto-retracking"
import Each from "./components/Each.tuan"
import NestedControlFlow from "./components/nested-control-flow.tuan"
// import NestedControlFlow from "./components/nested-control-flow.generated"

const appRoot = document.getElementById("app")!

mount(NestedControlFlow, appRoot)

