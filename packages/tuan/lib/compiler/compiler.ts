import * as acorn from "acorn"
import { analyze } from "periscopic"
import { NodeType, parse as parseHtml, type Node as HtmlNode } from "node-html-parser"
import type { Node } from "estree"



// we should ignore ts syntax
// the output should be pipe to vite later

export type CompilerOptions = {

}

const interpolationRegex = /\{(.*)\}/
export function compile(code: string, options: Partial<CompilerOptions>) {
    // First split script, css, and html part
    const fileRoot = parseHtml(`<div>${code}</div>`)
    const scriptNode = fileRoot.children.find(it => it.tagName === "script")

    if (scriptNode) {
        if (scriptNode.attributes.lang === "ts") {
            // fuck ts i will think about it later
        }

        // might need to rename some stuff to avoid name colission
    }

    // TODO: multi root component
    const rest = fileRoot.children.filter(it => it !== scriptNode)
    const root = rest[0]

    // traverse this to find which part of it use reactive value
    // then generate templateEffect function 
    function walk(node: HtmlNode) {
        // It's use less to walk those without { } (for now) 
        if (node.textContent.match(interpolationRegex)) {
            return
        }

        if (node.nodeType === NodeType.TEXT_NODE) {
            const text = node.textContent
            // how do i parse `whatever {} djdfhuj`
            if (!(text.startsWith("{") && text.endsWith("}"))) {
                return
            }
            const code = text.slice(1, -1)
            // Check if it's expression or not

            const expression = acorn.parseExpressionAt(code, 0, {
                ecmaVersion: "latest"
            })

            // Now we can codegen templateEffect but to optimize this i need to know if that global is a Signal or not
            const { globals } = analyze(expression as Node)
        }

        for (const child of node.childNodes) {
            walk(child)
        }
    }
    walk(root)
}
