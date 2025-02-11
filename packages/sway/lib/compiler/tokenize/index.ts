import { Lexer } from "./lexer";

export function tokenize(source: string) {
    const lexer = new Lexer(source)
    return lexer.scan()
}

export type { Token } from "./token"