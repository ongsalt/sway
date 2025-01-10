import * as acorn from "acorn"
import escodegen from "escodegen"
import type { Node } from "estree"
import { walk } from "estree-walker"
import { NodeType, parse as parseHtml, type Node as HtmlNode } from "node-html-parser"
import { Codegen } from "./codegen"
import { prettify } from "./formatter"
import { analyze } from "periscopic"
import { minifyHtml } from "./html"
import { parseInterpolation } from "./parser"


// we should ignore ts syntax
// the output should be pipe to vite later

export type CompilerOptions = {
    name: string
}

/*
Stage 1: split script, css and template part

Stage 2a: analyze and process the script 
    - throw every import to the start of the file
      everything else go under default exported function
    - TODO: throw compiler error if variable used in template is not defined
    - Optional: auto import reactivity primitive like nuxt (e.g. signal, computed)
      or make it a fucking $runed which is pain in the ass to do (might do it later tho)

Stage 2b: analyze the template and generate reactivity related code
    - Interpolation
        - basically this
            ```
            let text = $.at(node, [0, 1])
            $.templateEffect(() => $.setText(text, `sometext ${something.value}`))
            ```
        - need to think about interpolation inside if else block
    - look for {#if } {/if} {#each} {/each}
      node-html-parser support parsing custom expression with regex. these syntax is imple enough 
      so we probably shouldnt need to write a custom parser

    - due to dynamic nature of each we cant use $.at() with static path anymore
        alternative: 
        - each must return children count -> $.dynamicAt(() => [0, 1 + childrenCount, 0])
        - or change all runtime api to accept a dom node wrapper instead 
        {
            node: Node,
            index: number,
            }  
        wait we can, we know at render time what index the node is and we dont have to care its index later on
        beacuse we already have a reference to it.
        then for if/else we just use <!--> to replace maximum possible if/else root node as a marker
        but how do we replace it tho... -> Element.insertAdjacentElement('afterend', element)
        

Stage n: format the generated code

TODO: refactor this
*/
export function compile(code: string, options: Partial<CompilerOptions>) {
    let output = `import * as $ from "tuan/runtime";`
    let func = `export default function ${options.name ?? ""}($$context) {\n`

    // First split script, css, and html part
    const fileRoot = parseHtml(minifyHtml(code), {})
    const scriptNode = fileRoot.children.find(it => it.tagName === "SCRIPT")

    let script = ""
    script += 'const root = createRoot();\n'
    if (scriptNode) {
        if (scriptNode.attributes.lang === "ts") {
            // fuck ts i will think about this later
        }

        script += scriptNode.textContent
    }

    const program = acorn.parse(script, {
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
        script = script.substring(0, start) + script.substring(end)
    }

    // TODO: bind this
    // TODO: prettier this
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

    output = prettify(output)

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