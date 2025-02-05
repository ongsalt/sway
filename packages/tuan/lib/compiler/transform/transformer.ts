import * as acorn from "acorn"
import { Node } from "estree"
import { walk } from "estree-walker"
import { analyze } from "periscopic"
import { TemplateASTNode, Element } from "../parse/ast"
import { ComponentDeclarationStatement, TuanStatement } from "./statements"
import { stringify } from "./html"

export type TransformOptions = {
    name: string,
    ecmaVersion: string
}

export class Transformer {
    private options: TransformOptions
    
    private topLevelStatements: TuanStatement[] = []
    private componentDeclaration: ComponentDeclarationStatement
    private identifiers: Set<string>
    private script: string

    constructor(private roots: TemplateASTNode[], options: Partial<TransformOptions> = {}) {
        this.options = {
            name: options.name ?? "Component", // TODO: transform this-kind-of-name to ThisKind
            ecmaVersion: options.ecmaVersion ?? "2022"
        }
    }

    private transform() {
        this.transformScript()
        this.transformTemplate()
        this.topLevelStatements.push(this.componentDeclaration)
    }

    // $.template can return node[] or node ...
    private transformTemplate() {
        const roots: TemplateASTNode[][] = [] 

        function walk(node: TemplateASTNode) {
            if (node.type === "text") {
                // TODO: nested effect with cleanup
                // we need to compile node.texts then add an templateEffect
                return
            }
            if (node.type === "control-flow") {
                roots.push(node.children)
                if (node.kind === "if") {
                    roots.push(node.elseChildren)

                    node.elseChildren.forEach(it => walk(it))
                }
            }
            node.children.forEach(it => walk(it))
        }

        const componentRoots = this.roots.filter(it => !(it.type === "element" && it.tag === "script"))
        roots.push(componentRoots)
        for (const node of componentRoots) {
            walk(node)
        }
        // We need to create template function for all root and all each/if node
        for (const root of roots) {
            const name = this.createIdentifier('root')
            const template = stringify(root)
            console.log({
                name,
                template
            })
        }
    }

    private createIdentifier(name: string) {
        let _name = name
        let i = 1
        while (this.identifiers.has(_name)) { // Optimize: cache this
            _name = `${name}_${i}`
            i += 1;
        }
        this.identifiers.add(_name)
        return _name
    }

    private transformScript() {
        this.script = this.parseScript()
        const program = acorn.parse(this.script, {
            ecmaVersion: "latest",
            sourceType: "module"
        })
        const { globals, map, scope } = analyze(program as Node)

        this.transformImport(program)
        this.identifiers = scope.references

        this.componentDeclaration = {
            type: "component-declaration",
            name: this.options.name,
            body: [
                {
                    type: "user-script",
                    body: this.script
                }
            ],
        }
    }

    private transformImport(program: acorn.Program) {
        const toRemove: Node[] = []
        const { topLevelStatements } = this

        topLevelStatements.push({
            type: "any",
            body: "import * as $ from 'tuan/runtime';"
        })

        walk(program as Node, {
            enter(node, parent, key, index) {
                if (node.type === "ImportDeclaration") {
                    // i kinda get why they dont use ts in svelte 5 compiler now
                    // type N = Node & { start: number, end: number }
                    toRemove.push(node)
                    topLevelStatements.push({
                        type: "estree",
                        node: node
                    })
                }
            }
        });

        // bruh 
        // TODO: fix this 
        toRemove.reverse()
        for (const { start, end } of toRemove as (Node & { start: number, end: number })[]) {
            this.script = this.script.substring(0, start) + this.script.substring(end)
        }
    }

    // private parseIdentifiers() {

    // }

    private parseScript(): string {
        const script = this.roots.find(it => it.type === "element" && it.tag === "script") as Element | undefined
        if (!script || script.children.length !== 1 || script.children[0].type !== "text") {
            return "";
        }
        return script.children[0].texts[0].body;
    }

    build() {
        this.transform()
        let output = this.script
        // output += this.topLevelStatements
        return this.topLevelStatements
    }
}
