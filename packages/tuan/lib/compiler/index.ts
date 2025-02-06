import { parse } from "./parse"
import { tokenize } from "./tokenize"
import { transform } from "./transform"

export type CompilerOptions = {
    name?: string,
    ecmaVersion?: string
}

export function compile(source: string, options: CompilerOptions = {}) {
    const tokens = tokenize(source)
    const nodes = parse(tokens)
    const output = transform(nodes, {
        ...options
    })

    return output
}