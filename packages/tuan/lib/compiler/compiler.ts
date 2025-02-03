import * as acorn from "acorn"
import escodegen from "escodegen"
import type { Node } from "estree"
import { walk } from "estree-walker"
import { HTMLElement, NodeType, parse as parseHtml, type Node as HtmlNode } from "node-html-parser"
import { analyze } from "periscopic"
import { TagName } from "../types"
import { hasDollarSign } from "./analyzer"
import { Codegen } from "./codegen"
import { minifyHtml, prettify } from "./html"
import { parseSpecialMarkUp, parseInterpolation } from "./parser"


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
      node-html-parser support parsing custom expression with regex. these syntax is simple enough 
      so we probably dont need to write custom parser.
      IMPORTANT: AS WE NEED TO INSERT A COMMENT MARKER INTO DOM THIS MIGHT RESULT IN INDEX CHANGE SO 
        I WONT INSERT THOSE COMMENT IN COMPILING STEP, IT WILL BE ADDED DYNAMICALLY LATER WHEN THE COMPONENT RUN 

    - IF
      We also need to verify if those {#if } are correctly matched too
      It should be compiled to something like
      note that we use the comment as an anchor here
        ``` 
        $._if(
            () => condition.value, // some ComputedFn
            () => {
                let text = $.nodeAt(anchor, [])
            },
            () => {
                let text = $.nodeAt(anchor, [])
            }
        )
        ``` 

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
    const templateRoot = parseHtml(minifyHtml(code), {})
    const scriptNode = templateRoot.children.find(it => it.tagName === "SCRIPT")

    let script = ""

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

    if (hasDollarSign(scope.references)) {
        throw new Error("$ prefix is reserved for framework internal use.")
    }

    // Template codegen -------------------
    const codegen = new Codegen(scope.references)

    const rest = templateRoot.children.filter(it => it !== scriptNode)
    const { body, template, rootName } = compileTemplate(rest, codegen)

    func += codegen.root(rootName)
    func += script + '\n\n';
    func += body + '\n\n';

    output += template;
    output += func + '\n\n}';

    try {
        output = prettify(output)
    } catch {
        throw new Error("invalid syntax")
    }

    console.log(output)

    return output
}

function compileTemplate(rest: HTMLElement[], codegen: Codegen) {
    // TODO: multi root
    const root = rest[0]
    const rootName = '$$root'

    let declarations = ''
    function addDeclaration(declaration: string) {
        declarations += declaration;
    }

    let body = ''
    function addStatement(statements: string) {
        body += statements;
    }

    type ControlFlowContext = {
        parent?: HTMLElement,
        previousAnchor: string
        type: "if" | "each"
    }
    let controlFlowContexts: ControlFlowContext[] = [] // should track tree depth
    let currentAnchor = rootName

    function processTextInterpolation(node: HtmlNode, path: number[]) {
        if (node.nodeType === NodeType.TEXT_NODE && node.childNodes.length === 0) {

            // Check if it interpolation or our markup syntax   
            const { isSpecialMarkUp, node: controlFlowNode } = parseSpecialMarkUp(node.textContent)
            if (isSpecialMarkUp) {
                // TODO: Check if {#if}, ... are match
                const parent = path.length == 1 ? undefined : node.parentNode
                switch (controlFlowNode.type) {
                    case "if": {
                        controlFlowContexts.push({
                            parent,
                            type: "if",
                            previousAnchor: currentAnchor
                        })

                        break
                    }
                    case "elif": {
                        const context = controlFlowContexts.pop();
                        if (!context || context?.parent === parent || context.type !== "if") {
                            throw new Error("if and elif must be on the same level")
                        }
                        currentAnchor = context.previousAnchor;
                        break
                    }
                }
            } else {
                // case: normal interpolation
                const texts = parseInterpolation(node.textContent)
                const isInterpolated = texts.some(it => it.type === "interpolation") // bruh
                if (!isInterpolated) {
                    return; // text nodes are always leaf
                }
                const interpolation = codegen.stringInterpolation(texts)
                // 1. Generate accessor for the text node
                // accessor: $.nodeAt(parent, path)
                // TODO: the node might dissapear if .textContent === ""
                // TODO: read html spec/check how browsers parse html, it probably gonna give me a headache
                const { name, statement } = codegen.accessor("text", path, rootName, "node")
                addDeclaration(statement)
                // 2. Generate template effect
                addStatement(codegen.textEffect(name, interpolation))
                node.textContent = " "
            }
        }

        node.childNodes.forEach((child, index) => {
            processTextInterpolation(child, [...path, index])
        })
    }

    function processAttributes(element: HTMLElement, path: number[]) {
        let accessorName: string | null = null
        for (const [attribute, value] of Object.entries(element.attributes)) {
            // event handler: on... can only be "{}" expression like this at must be callable
            if (attribute.startsWith("on")) {
                if (!(value.startsWith("{") && value.endsWith("}"))) {
                    throw new Error(`Invalid attributes ${attribute}="${value}"`)
                }
                const expression = value.substring(1, value.length - 1)
                const type = attribute.substring(2)
                if (accessorName === null) {
                    const { name, statement } = codegen.accessor(element.tagName.toLowerCase() as TagName, path, rootName, "element")
                    // TODO: validate expression
                    addDeclaration(statement)
                    accessorName = name
                }
                addStatement(codegen.listener(accessorName, type, expression))
                element.removeAttribute(attribute)
            } else {
                // every other attribute can be bind the same way as text interpolation
                const texts = parseInterpolation(value)
                const isInterpolated = texts.some(it => it.type === "interpolation")
                if (isInterpolated) {
                    const interpolation = codegen.stringInterpolation(texts)
                    if (accessorName === null) {
                        const { name, statement } = codegen.accessor(element.tagName.toLowerCase() as TagName, path, rootName, "element")
                        // TODO: validate expression
                        addDeclaration(statement)
                        accessorName = name
                    }
                    addStatement(codegen.attrEffect(accessorName, attribute, interpolation))
                    // remove it from template
                    element.removeAttribute(attribute)
                } else {
                    // leave as is
                }
            }
        }

        element.children.forEach((child, index) => {
            processAttributes(child, [...path, index])
        })
    }


    // We 
    processTextInterpolation(root, [0])
    addDeclaration('\n')
    processAttributes(root, [0])

    body = declarations + '\n\n' + body + '\n\n';
    body += codegen.append('$$context.anchor', rootName)

    const html = root.toString()

    // console.log(body)

    return {
        template: codegen.template(html),
        body,
        rootName
    }
}
