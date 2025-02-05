import { it } from "vitest"
import { parse } from "../../lib/compiler/parse"
import { tokenize } from "../../lib/compiler/tokenize"
import { eachInput, ifElseInput, simpleInput } from "./testcases"


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)

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
    console.dir(node, { depth: null })
})
