import { it } from "vitest"
import { parse } from "../lib/compiler/parse"
import { tokenize } from "../lib/compiler/tokenize"
import { simpleInput } from "./testcases"


it('should parse this thing', () => {
    const tokens = tokenize(simpleInput)

    const node = parse(tokens)
    console.dir(node, { depth: null })
})