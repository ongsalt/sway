import { it } from "vitest";
import { compile } from "../../lib/compiler";
import { complexIfElseInput, eachInput, ifElseInput, nestedControlFlowInput, simpleInput } from "./testcases";

// i will properly do this once these apis are stable

it('should compile this if else thing', () => {
    const { output, ast } = compile(ifElseInput);
    // console.dir(ast, { depth: null })
    console.log(output);
    // expect(lexer.tokens).toStrictEqual(lexerOutput)
});


it('should compile simple input', () => {
    const output = compile(simpleInput);
    // console.log(output)
});

// it('should compile attribute binding', () => {
//     const source = `<button class="p-2 border {active ? 'bg-blue-500' : 'bg-blue-100'} {otherClass}" onclick={fn}> something </button>`
//     const output = compile(source)
//     // console.log(output)
// })


// it('should compile nested control flow', () => {
//     const output = compile(nestedControlFlowInput)
//     // console.log(output)
// })

it('should compile complex if statement', () => {
    const { ast, output } = compile(complexIfElseInput);
    // console.dir(ast, { depth: null })
    console.log(output);
});

it('should compile each statement', () => {
    const { ast, output } = compile(eachInput);
    // console.dir(ast, { depth: null })
    console.log(output);
});