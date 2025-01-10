import { mount } from "tuan"

// "Click to show definitions" is handled by an extension
import Interpolation from "./components/interpolation.tuan"
import { autoRetracking } from "./features/auto-retracking"
// import Interpolation from "./components/internal/interpolation"

const appRoot = document.getElementById("app")!
console.log(appRoot)
mount(Interpolation, appRoot)

// autoRetracking()