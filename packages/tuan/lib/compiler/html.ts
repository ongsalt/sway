import type { Node } from "estree"
import * as acorn from "acorn"
import escodegen from "escodegen"
import { minify } from "html-minifier"

export function minifyHtml(html: string): string {
    const minified = minify(html, {
        collapseWhitespace: true,
    })
    // TODO: escape this
    return minified
}
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
