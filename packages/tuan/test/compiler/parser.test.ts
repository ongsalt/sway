import { expect, it } from "vitest"
import { parse } from "../../lib/compiler/parse"
import { tokenize } from "../../lib/compiler/tokenize"
import { eachInput, ifElseInput, simpleInput } from "./testcases"


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)

    const node = parse(tokens)
    // console.dir(node, { depth: null })
})

it('should parse multiroot component', () => {
    const tokens = tokenize(`
        <button onclick={toggle}> Log in </button>
    <button onclick={toggle}> Log in </button>
`)

    const node = parse(tokens)
    // console.dir(node, { depth: null })
})

it('should parse if block', () => {
    const tokens = tokenize(ifElseInput)
    // console.log(tokens)

    const node = parse(tokens)
    // console.dir(node, { depth: null })
})

it('should parse each block', () => {
    const tokens = tokenize(eachInput)
    // console.log(tokens)

    const node = parse(tokens)
    // console.dir(node, { depth: null })
})

it('should parse attribute binding', () => {
    const source = `<button class="p-2 border {active ? 'bg-blue-500' : 'bg-blue-100'} {otherClass}" onclick={fn}> something </button>`
    const tokens = tokenize(source)
    const node = parse(tokens)
    // console.dir(node, { depth: null })
})