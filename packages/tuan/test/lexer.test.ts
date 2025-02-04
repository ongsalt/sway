import { expect, it } from "vitest"
import { Lexer } from "../lib/compiler/tokenize/lexer"
import { input, lexerOutput, simpleInput } from "./testcases"
import { tokenize } from "../lib/compiler/tokenize"


it('should parse this thing', () => {
    const lexer = new Lexer(input)
    lexer.scan()
    // console.log(lexer.tokens)
    expect(lexer.tokens).toStrictEqual(lexerOutput)
})


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)
    console.log(tokens)
})