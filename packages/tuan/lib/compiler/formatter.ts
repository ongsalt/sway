import type { Node } from "estree"
import * as acorn from "acorn"
import escodegen from "escodegen"

// TODO: use real prettify 
export function prettify(code: string) {
    const program = acorn.parse(code, {
        ecmaVersion: "latest",
        sourceType: "module",
    })
    return escodegen.generate(program as Node, {
        format: {

        }
    })
}
