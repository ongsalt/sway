import * as acorn from "acorn"
import { Node } from "estree"
import { walk } from "estree-walker"
import { analyze } from "periscopic"
import { ControlFlowNode, Element, TemplateASTNode } from "../parse/ast"
import { generate } from "./codegen"
import { stringify } from "./html"
import { AccessorDefinitionStatement, BindingStatement, ComponentDeclarationStatement, CreateRootStatement, EventListenerAttachingStatement, priority, SwayStatement, TemplateEachStatement, TemplateIfStatement, TemplateRootStatement, TemplateScopeStatement } from "./statements"

export type TransformOptions = {
    name: string,
    ecmaVersion: string
}

type NodePath = string

export class Transformer {
    private options: TransformOptions

    private identifiers!: Set<string>
    // will be prune if not use
    private accessors: Map<TemplateASTNode, (AccessorDefinitionStatement | CreateRootStatement)> = new Map()

    constructor(private roots: TemplateASTNode[], options: Partial<TransformOptions> = {}) {
        this.options = {
            name: options.name ?? "Component", // TODO: transform this-kind-of-name to ThisKind
            ecmaVersion: options.ecmaVersion ?? "2022"
        }
    }

    private transform() {
        const { importStatements, script } = this.transformScript()
        const { roots, generated } = this.transformTemplate(script)

        const componentDeclaration: ComponentDeclarationStatement = {
            type: "component-declaration",
            before: [
                ...importStatements,
                ...roots
            ],
            fn: {
                type: "component-function",
                name: this.options.name,
                body: [
                    // {
                    //     type: "user-script",
                    //     body: script
                    // },
                    generated,
                ]
            },
            after: []
        }

        return componentDeclaration
    }

    private transformBinding() {

    }

    private transformTemplate(userScript: string) {
        const roots: TemplateRootStatement[] = []

        // fuck `this`
        const walk = (node: TemplateASTNode, parents: (Element | ControlFlowNode)[]): SwayStatement[] => {
            const out: SwayStatement[] = []
            if (node.type === "text") {
                const isInterpolated = node.texts.some(it => it.type === "interpolation")

                // we need to compile node.texts then add an templateEffect
                if (isInterpolated) {
                    // 1. create accessor
                    const accessors = this.createAccessor(node, parents)
                    out.push(...accessors)
                    // 2. create templateEffect
                    out.push({
                        type: "template-effect",
                        body: [
                            {
                                type: "text-setting",
                                accessor: accessors.at(-1)!.name,
                                texts: node.texts
                            }
                        ]
                    })
                }
            }

            if (node.type === "control-flow") {
                if (node.kind === "if") {
                    const anchorAccessors = this.createAccessor(node, parents)
                    const anchor = anchorAccessors.at(-1)!.name
                    out.push(...anchorAccessors)

                    const { name, statement } = this.createTemplateRoot(node)
                    roots.push(statement);
                    const { accessor, name: fragment } = this.createRootFragment(node, name);

                    const ifScope: TemplateIfStatement = {
                        type: "if",
                        condition: node.condition,
                        anchor,
                        fragment: fragment,
                        body: [
                            accessor,
                            ...node.children.map(it => walk(it, [node])).flat()
                        ],
                        blockName: this.createIdentifier("then"),
                    }

                    if (node.else) {
                        const _else = node.else;
                        const { name, statement } = this.createTemplateRoot(_else)
                        const { accessor, name: fragment } = this.createRootFragment(_else, name);
                        roots.push(statement);

                        const statements = _else.children.map(it => walk(it, [_else, node])).flat()

                        ifScope.else = {
                            blockName: this.createIdentifier("alternative"),
                            fragment,
                            body: [accessor, ...statements]
                        }
                    }

                    out.push(ifScope)
                } else if (node.kind === "else") {
                    throw new Error("this is not possible unless the parser got high or something")
                } else { // TODO: each
                    const anchorAccessors = this.createAccessor(node, parents)
                    const anchor = anchorAccessors.at(-1)!.name
                    out.push(...anchorAccessors)

                    const { name, statement } = this.createTemplateRoot(node)
                    roots.push(statement);
                    const { accessor, name: fragment } = this.createRootFragment(node, name);

                    // TODO: parse as and index
                    const eachScope: TemplateEachStatement = {
                        type: "each",
                        anchor,
                        iteratable: node.iteratable,
                        as: node.as,
                        index: node.index,
                        key: node.key,
                        fragment: fragment,
                        body: [
                            accessor,
                            ...node.children.map(it => walk(it, [node])).flat()
                        ],
                    }

                    out.push(eachScope)
                }
            } else if (node.type === "element") {
                let _accessors: AccessorDefinitionStatement[] | null = null
                let _accessor: AccessorDefinitionStatement | null = null
                const getOrCreateAccessor = () => {
                    if (!_accessor) {
                        _accessors = this.createAccessor(node, parents)
                        _accessor = _accessors.at(-1)!
                        out.push(..._accessors)
                    }
                    return {
                        accessor: _accessor,
                        accessors: _accessors
                    }
                }

                // if we have attribute binding
                for (const attribute of node.attributes) {
                    if (attribute.whole) {
                        const { accessor } = getOrCreateAccessor()
                        if (attribute.isBinding) {
                            const segmentedTarget = attribute.expression.split('.')
                            const targetName = segmentedTarget.slice(0, -1).join('.')
                            const targetKey = segmentedTarget.at(-1)
                            if (!targetKey) {
                                // TODO: better error message
                                throw new Error("invalid binding")
                            }
                            const statement: BindingStatement = {
                                type: "binding",
                                key: attribute.key,
                                node: accessor.name,
                                target: {
                                    type: "proxy",
                                    obj: targetName,
                                    key: targetKey,
                                }, // todo check if this is a variable
                            }
                            out.push(statement)
                        } else {

                            // determine if this is a listener or not
                            // i will just check for on prefix
                            // TODO: handle node.type "component"(?) differently
                            const isListener = attribute.key.startsWith('on')
                            if (isListener) {
                                const statement: EventListenerAttachingStatement = {
                                    type: "event-listener",
                                    node: accessor.name,
                                    event: '"' + attribute.key.slice(2) + '"',
                                    // TODO: validate if this is a function or not
                                    listenerFn: attribute.expression
                                }
                                out.push(statement)
                            } else {
                                // do the same as below   
                            }
                        }
                    } else {
                        if (attribute.texts.some(it => it.type === "interpolation")) {
                            // TODO: 
                        }
                    }
                }

                const statements = node.children.map(it => walk(it, [node, ...parents]))
                out.push(...statements.flat())
            }

            out.sort((a, b) => priority(a) - priority(b))
            return out;
        }

        const componentRoots = this.roots.filter(it => !(it.type === "element" && it.tag === "script"))

        const elementRoot: Element = {
            type: "element",
            tag: "$$root",
            attributes: [],
            isSelfClosing: false,
            children: componentRoots
        }

        const rootName = this.createIdentifier("root");
        roots.push({
            type: "template-root",
            name: rootName,
            template: stringify(elementRoot.children)
        })
        const { name: rootFragmentName, accessor: rootAccessor } = this.createRootFragment(elementRoot, rootName)

        let scope: TemplateScopeStatement = {
            type: 'template-scope',
            body: [
                rootAccessor,
                {
                    type: "user-script",
                    body: userScript
                },
                ...walk(elementRoot, [elementRoot]),
                {
                    type: "append",
                    anchor: "$$context.anchor",
                    node: rootFragmentName
                }
            ]
        };


        return {
            roots,
            generated: scope
        };
    }

    private createTemplateRoot(node: (ControlFlowNode | Element)) {
        const name = this.createIdentifier("root");
        const statement: TemplateRootStatement = {
            type: "template-root",
            name,
            template: stringify(node.children)
        }
        return {
            name,
            statement
        }
        // this.accessors.set(node, root)
    }

    private createRootFragment(rootNode: (ControlFlowNode | Element), rootName: string) {
        const name = this.createIdentifier("fragment");
        const accessor: CreateRootStatement = {
            type: "create-root",
            name,
            root: rootName
        }
        this.accessors.set(rootNode, accessor)
        return {
            name,
            accessor
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

    private createAccessor(node: TemplateASTNode, parents: (Element | ControlFlowNode)[]): AccessorDefinitionStatement[] {
        const [immediateParent, ...rest] = parents;

        // Actually we could use any name
        // console.log(node, parents)
        const preferredName = node.type === "text" ? "text"
            : node.type === "control-flow" ? "anchor" : node.tag;
        const name = this.createIdentifier(preferredName);

        // will also create accessor for all intermediate parent
        let parentAccessor = this.accessors.get(immediateParent);
        let previous: AccessorDefinitionStatement[] = []
        if (!parentAccessor) {
            // console.log(immediateParent, rest)
            previous = this.createAccessor(immediateParent, rest);
            parentAccessor = previous.at(-1)!
        }

        // let index = 0;
        // for (const child of immediateParent.children) {
        //     if (child !== node) {
        //         if (child.type === "control-flow" && chi)
        //         index += 1;
        //     }
        // }

        const accessor: AccessorDefinitionStatement = {
            type: "accessor-definition",
            // mode: immediateParent.type === "control-flow" ? "sibling" : "children",
            mode: "children",
            parent: parentAccessor.name,
            // TODO?: count if with else as 2 node
            index: immediateParent.children.findIndex(it => it === node),
            name,
        }
        this.accessors.set(node, accessor);
        return [...previous, accessor]
    }

    private transformScript() {
        let rawScript = this.parseScript()
        const program = acorn.parse(rawScript, {
            ecmaVersion: "latest",
            sourceType: "module"
        })
        const { globals, map, scope } = analyze(program as Node)

        const { importStatements, script } = this.transformImport(program, rawScript)
        this.identifiers = scope.references;

        return {
            importStatements,
            script
        }
    }

    private transformImport(program: acorn.Program, script: string) {
        const toRemove: Node[] = []
        const importStatements: SwayStatement[] = [
            {
                type: "any",
                body: "import * as $ from 'sway/runtime';"
            }
        ]

        walk(program as Node, {
            enter(node, parent, key, index) {
                if (node.type === "ImportDeclaration") {
                    // i kinda get why they dont use ts in svelte 5 compiler now
                    // type N = Node & { start: number, end: number }
                    toRemove.push(node)
                    importStatements.push({
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
            script = script.substring(0, start) + script.substring(end)
        }

        return {
            script,
            importStatements,
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
        const root = this.transform()
        // output += this.topLevelStatements
        // console.log(root)
        const output = generate(root, 0, true)
        // console.log(this.accessors)
        // console.log(output)
        return {
            ast: root, // i should call this something else
            output,
        };
    }
}
