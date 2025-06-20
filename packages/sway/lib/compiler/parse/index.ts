import { Lexer } from "./lexer";
import { Parser } from "./parser";

export function parse(source: string) {
    const tokens = tokenize(source);
    const parser = new Parser(tokens);
    return parser.parse();
}


export function tokenize(source: string) {
    const lexer = new Lexer(source);
    return lexer.scan();
}

export type { Token } from "./token";
