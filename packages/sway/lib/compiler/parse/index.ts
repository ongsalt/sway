import { Parser } from "./parser";
import type { Token } from "../tokenize"

export function parse(tokens: Token[]) {
    const parser = new Parser(tokens)
    return parser.parse()
}
