import { expect, it } from "vitest"
import { tokenize } from "../../lib/compiler/tokenize"
import { ifElseInput, simpleInput } from "./testcases"


it('should parse this thing', () => {
    const tokens = tokenize(ifElseInput)
    console.log(tokens)
    // i will properly do this later
    // expect(lexer.tokens).toStrictEqual(lexerOutput)
})


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)
    // console.log(tokens)
})

it('should do script escaping magic', () => {
    const source = `<script lang="ts">
        const a = 1 < 5;
    </script>`
    const tokens = tokenize(source)
    console.log(tokens)
    expect(tokens).toStrictEqual([
        { type: 'tag-open', line: 1 },
        { type: 'literal', body: 'script', line: 1 },
        { type: 'literal', body: 'lang', line: 1 },
        { type: 'equal', line: 1 },
        { type: 'quoted', body: 'ts', line: 1 },
        { type: 'tag-close', line: 1 },
        { type: 'text', body: 'const a = 1 < 5;', line: 3 },
        { type: 'tag-open-2', line: 3 },
        { type: 'literal', body: 'script', line: 3 },
        { type: 'tag-close', line: 3 },
        { type: 'eof', line: 3 }
    ])
})