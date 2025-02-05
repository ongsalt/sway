import { it } from "vitest"
import { compile } from "../../lib/compiler"
import { ifElseInput, nestedControlFlowInput, simpleInput } from "./testcases"

// i will properly do this once these apis are stable

// it('should compile this thing', () => {
//     const output = compile(ifElseInput)
//     console.log(output)
//     // expect(lexer.tokens).toStrictEqual(lexerOutput)
// })


it('should compile simple input', () => {
    const output = compile(simpleInput)
    // console.log(output)
})

// it('should compile attribute binding', () => {
//     const source = `<button class="p-2 border {active ? 'bg-blue-500' : 'bg-blue-100'} {otherClass}" onclick={fn}> something </button>`
//     const output = compile(source)
//     // console.log(output)
// })


it('should compile nested control flow', () => {
    const output = compile(nestedControlFlowInput)
    // console.log(output)
})
