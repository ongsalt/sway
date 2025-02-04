import { expect, it } from "vitest"
import { Lexer } from "../../lib/compiler/tokenize/lexer"
import { ifElseInput, simpleInput } from "./testcases"
import { tokenize } from "../../lib/compiler/tokenize"


it('should parse this thing', () => {
    const lexer = new Lexer(ifElseInput)
    lexer.scan()
    // console.log(lexer.tokens)
    // i will properly do this later
    // expect(lexer.tokens).toStrictEqual(lexerOutput)
})


it('should parse simple input', () => {
    const tokens = tokenize(simpleInput)
    console.log(tokens)
})