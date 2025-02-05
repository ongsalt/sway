import { parse } from "./parse"
import { tokenize } from "./tokenize"
import { transform } from "./transform"

export { compile as compile_legacy, type CompilerOptions as CompilerOptions_legacy } from "./legacy/compiler"

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