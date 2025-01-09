import * as acorn from "acorn"
import escodegen from "escodegen"
import type { Node } from "estree"
import { walk } from "estree-walker"
import { NodeType, parse as parseHtml, type Node as HtmlNode } from "node-html-parser"
import { NodeCount } from "../types"
import { generateInterpolation, generateTextAccessor } from "./codegen"
import { minifyHtml } from "./html"
import { parseInterpolation } from "./parser"


// we should ignore ts syntax
// the output should be pipe to vite later

export type CompilerOptions = {
    name: string
}

export function compile(code: string, options: Partial<CompilerOptions>) {
    let output = `import * as $ from "tuan/runtime";`
    let func = `export default function ${options.name ?? ""}($$context) {\n`
    // First split script, css, and html part
    const fileRoot = parseHtml(`${code}`)
    // console.log(fileRoot)
    const scriptNode = fileRoot.children.find(it => it.tagName === "SCRIPT")
    let script = ""

    // to prevent name coliision
    const nodeCount: NodeCount = {
        text: 0
    }

    if (scriptNode) {
        if (scriptNode.attributes.lang === "ts") {
            // fuck ts i will think about this later
        }

        let code = scriptNode.textContent
        const program = acorn.parse(code, {
            ecmaVersion: "latest",
            sourceType: "module"
        })

        const toRemove: (Node & { start: number, end: number })[] = []
        walk(program as Node, {
            enter(node, parent, key, index) {
                if (node.type === "ImportDeclaration") {
                    toRemove.push(node as Node & { start: number, end: number })
                    output = escodegen.generate(node) + '\n' + output
                }
            }
        })

        toRemove.reverse()
        for (const { start, end } of toRemove) {
            code = code.substring(0, start) + code.substring(end)
        }

        // TODO: bind this
        // TODO: prettier this
        script += code
        output += '\n\n'
    }

    func += script + '\n\n';

    // parse html part ---------------

    // TODO: multi root component
    const rest = fileRoot.children.filter(it => it !== scriptNode)
    const root = rest[0]

    // TODO: move this to seperated function
    // traverse this to find which part of it use reactive value
    // then generate templateEffect function 
    function walk_(node: HtmlNode, path: number[]) {
        if (node.nodeType !== NodeType.TEXT_NODE) {
            node.childNodes.forEach((child, index) => {
                walk_(child, [...path, index])
            })
            return
        }

        const texts = parseInterpolation(node.textContent)
        // const isReactive = texts.some(it => it.type === "interpolation")
        const isReactive = texts.length > 1
        const interpolationCode = generateInterpolation(texts)
        if (isReactive) {
            // 1. Generate accessor for the text node
            // accessor: $$runtime.at(parent, path)
            generateTextAccessor(nodeCount, path)
            func += `\n`
            // 2. Generate template effect
        } else {
            // embed it into html as is -> ignore
        }
    }

    walk_(root, [0])

    console.log(
        minifyHtml(root.toString())
    )

    func += "\n}"
    output += func
    return output
}
