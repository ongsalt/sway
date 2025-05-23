import { expect, it } from "vitest"
import { tokenize } from "../../lib/compiler/tokenize"
import { bindingInput, ifElseInput, simpleInput } from "./testcases"

// i will properly do this once these apis are stable

it('should parse this thing', () => {
    const tokens = tokenize(ifElseInput)
    // console.log(tokens)
    // expect(lexer.tokens).toStrictEqual(lexerOutput)
})


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)
    // console.log(tokens)
})

it('should parse attribute binding', () => {
    const source = `<button class="p-2 border {active ? 'bg-blue-500' : 'bg-blue-100'} {otherClass}" onclick={fn}> something </button>`
    const tokens = tokenize(source)
    // console.log(tokens)
})

it('should do script escaping magic', () => {
    const source = `<script lang="ts">
        const a = 1 < 5;
    </script>`
    const tokens = tokenize(source)
    // console.log(tokens)
    // expect(tokens).toStrictEqual([
    //     { type: 'tag-open', line: 1 },
    //     { type: 'literal', body: 'script', line: 1 },
    //     { type: 'literal', body: 'lang', line: 1 },
    //     { type: 'equal', line: 1 },
    //     { type: 'double-quote', line: 1 },
    //     { type: 'literal', body: 'ts', line: 1 },
    //     { type: 'double-quote', line: 1 },
    //     { type: 'tag-close', line: 1 },
    //     { type: 'text', body: 'const a = 1 < 5;', line: 3 },
    //     { type: 'tag-open-2', line: 3 },
    //     { type: 'literal', body: 'script', line: 3 },
    //     { type: 'tag-close', line: 3 },
    //     { type: 'eof', line: 3 }
    // ])
})

it('should parse complex interpolation', () => {
    const tokens = tokenize(`<p> text {expression} 秦谷 美鈴 {add(3, 5)} </p>`)

    // console.log(tokens)

    // ignore p
    expect(tokens.slice(3, -4)).toStrictEqual([
        { type: 'text', body: 'text ', line: 1 },
        { type: 'interpolation', body: 'expression', line: 1 },
        { type: 'text', body: ' 秦谷 美鈴 ', line: 1 },
        { type: 'interpolation', body: 'add(3, 5)', line: 1 },
    ])
})


it('should parse bind:...', () => {
    const tokens = tokenize(bindingInput)
    // console.log(tokens)
    // expect(lexer.tokens).toStrictEqual(lexerOutput)
})
