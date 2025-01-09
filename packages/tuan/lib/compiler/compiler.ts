import * as acorn from "acorn"
import escodegen from "escodegen"
import type { Node } from "estree"
import { walk } from "estree-walker"
import { NodeType, parse as parseHtml, type Node as HtmlNode } from "node-html-parser"
import { NodeCount } from "../types"
import { Codegen } from "./codegen"
import { analyze } from "periscopic"
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
    const fileRoot = parseHtml(minifyHtml(code), {})
    const scriptNode = fileRoot.children.find(it => it.tagName === "SCRIPT")
    let script = ""

    let scriptCode = ""

    scriptCode += 'const root = createRoot();\n'
    if (scriptNode) {
        if (scriptNode.attributes.lang === "ts") {
            // fuck ts i will think about this later
        }

        scriptCode += scriptNode.textContent
    }

    const program = acorn.parse(scriptCode, {
        ecmaVersion: "latest",
        sourceType: "module"
    })
    const { globals, map, scope } = analyze(program as Node)

    // Moving import 
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
        scriptCode = scriptCode.substring(0, start) + scriptCode.substring(end)
    }

    // TODO: bind this
    // TODO: prettier this
    script += scriptCode
    output += '\n\n'

    func += script + '\n\n';


    // Template codegen -------------------
    const codegen = new Codegen(scope.references)

    let declarations = ''
    function addDeclaration(declaration: string) {
        declarations += declaration;
    }

    let body = ''
    function addStatement(statements: string) {
        body += statements;
    }


    // TODO: multi root component
    const rest = fileRoot.children.filter(it => it !== scriptNode)
    const root = rest[0]
    const html = root.toString()
    const rootName = 'root'

    output += codegen.template(html)

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
        const interpolation = codegen.interpolation(texts)
        if (isReactive) {
            // 1. Generate accessor for the text node
            // accessor: $.at(parent, path)
            const { name, statement } = codegen.accessor("text", path, rootName)
            addDeclaration(statement)
            // 2. Generate template effect
            addStatement(codegen.textEffect(name, interpolation))
        } else {
            // embed it into html as is -> ignore
        }
    }

    walk_(root, [0])

    func += declarations + '\n\n' + body + '\n\n';

    func += '$.append($$context.anchor, root);\n}';
    output += func;

    console.log({
        html,
        output
    })
    return output
}


/*
Subroutine: compile_template
return: 
 - $.template("[with {interpolation} removed]")
 - list of node references (as needed)
    $.at(root, [1, 2, 4])
 - list of template effect
    $.templateEffect(() => {
        $.setText(node, template)
    })
 [later]
 - bindThis
 - condition
 - each
*/