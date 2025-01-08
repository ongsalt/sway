import interpolation from "./components/interpolation.tuan?raw"
import { a, compile } from "tuan"
import * as $ from "tuan/runtime"



console.log(
    $.at(document.body, [0])
)
document.body.textContent = "Hello world"

const result = compile(interpolation, {})
console.log(result)
