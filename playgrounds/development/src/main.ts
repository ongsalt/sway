import { mount } from "tuan"

// "Click to show definitions" is handled by an extension
// import Interpolation from "./components/interpolation.tuan"
// import Attributes from "./components/attributes.tuan"
// import { autoRetracking } from "./features/auto-retracking"
import IfElse from "./components/if-else"

const appRoot = document.getElementById("app")!
// console.log(appRoot)

// mount(Interpolation, appRoot)
mount(IfElse, appRoot)
