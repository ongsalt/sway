import { mount } from "tuan"

// "Click to show definitions" is handled by an extension
// import Interpolation from "./components/interpolation.tuan"
// import Attributes from "./components/attributes.tuan"
// import { autoRetracking } from "./features/auto-retracking"
import IfElse from "./components/if-else.tuan"

const appRoot = document.getElementById("app")!

mount(IfElse, appRoot)
