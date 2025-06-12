import * as acorn from "acorn";
import { Node } from "estree";
import { walk } from "estree-walker";
import { analyze } from "periscopic";
import { ControlFlowNode, Element, TemplateASTNode } from "../parse/ast";
import { generate } from "./codegen";
import { stringify } from "./html";
import { AccessorDefinitionStatement, Binding, BindingStatement, ComponentDeclarationStatement, TemplateInitStatement, EventListenerAttachingStatement, priority, SwayStatement, TemplateEachStatement, TemplateIfStatement, TemplateDefinitionStatement, TemplateScopeStatement } from "./statements";

export type TransformOptions = {
    name: string,
    ecmaVersion: string,
    logging: boolean;
};

type NodePath = string;

// i should rewrite this shit
export class Transformer {
    private options: TransformOptions;

    private identifiers!: Set<string>;
    // will be prune if not use
    private accessors: Map<TemplateASTNode, (AccessorDefinitionStatement | TemplateInitStatement)> = new Map();

    constructor(private roots: TemplateASTNode[], options: Partial<TransformOptions> = {}) {
        this.options = {
            name: options.name ?? "Component", // TODO: transform this-kind-of-name to ThisKind
            ecmaVersion: options.ecmaVersion ?? "2022",
            logging: options.logging ?? false
        };
    }

    private transform() {
        const { importStatements, script } = this.transformScript();
        const { roots, generated } = this.transformTemplate(script);

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
        };

        return componentDeclaration;
    }

    private transformBinding() {

    }

    private transformTemplate(userScript: string) {
        const statements: TemplateDefinitionStatement[] = [];

        // fuck `this`
        const walk = (node: TemplateASTNode, parents: (Element | ControlFlowNode)[]): SwayStatement[] => {
            const out: SwayStatement[] = [];
            if (node.type === "text") {
                const isInterpolated = node.texts.some(it => it.type === "interpolation");

                // we need to compile node.texts then add an templateEffect
                if (isInterpolated) {
                    // 1. create accessor
                    const accessors = this.createAccessor(node, parents);
                    out.push(...accessors);
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
                    });
                }
            }

            if (node.type === "control-flow") {
                if (node.kind === "if") {
                    const anchorAccessors = this.createAccessor(node, parents);
                    const anchor = anchorAccessors.at(-1)!.name;
                    out.push(...anchorAccessors);

                    const { name, statement } = this.createTemplateDefinition(node);
                    statements.push(statement);
                    const { accessor, name: fragment } = this.createTemplateInit(node, name);

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
                    };

                    if (node.else) {
                        const _else = node.else;
                        const { name, statement } = this.createTemplateDefinition(_else);
                        const { accessor, name: fragment } = this.createTemplateInit(_else, name);
                        statements.push(statement);

                        const s = _else.children.map(it => walk(it, [_else, node])).flat();

                        ifScope.else = {
                            blockName: this.createIdentifier("alternative"),
                            fragment,
                            body: [accessor, ...s]
                        };
                    }

                    out.push(ifScope);
                } else if (node.kind === "else") {
                    throw new Error("this is not possible unless the parser got high or something");
                } else { // TODO: each
                    const anchorAccessors = this.createAccessor(node, parents);
                    const anchor = anchorAccessors.at(-1)!.name;
                    out.push(...anchorAccessors);

                    const { name, statement } = this.createTemplateDefinition(node);
                    statements.push(statement);
                    const { accessor, name: fragment } = this.createTemplateInit(node, name);

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
                    };

                    out.push(eachScope);
                }
            } else if (node.type === "element") {
                let _accessors: AccessorDefinitionStatement[] | null = null;
                let _accessor: AccessorDefinitionStatement | null = null;
                const getOrCreateAccessor = () => {
                    if (!_accessor) {
                        _accessors = this.createAccessor(node, parents);
                        _accessor = _accessors.at(-1)!;
                        out.push(..._accessors);
                    }
                    return {
                        accessor: _accessor,
                        accessors: _accessors
                    };
                };

                // if we have attribute binding
                for (const attribute of node.attributes) {
                    if (attribute.whole) {
                        const { accessor } = getOrCreateAccessor();
                        if (attribute.isBinding) {
                            // parse this
                            // if attribute.expression 
                            const statement: BindingStatement = {
                                type: "binding",
                                key: attribute.key,
                                node: accessor.name,
                                binding: this.parseBinding(attribute.expression)
                            };
                            out.push(statement);
                        } else {

                            // determine if this is a listener or not
                            // i will just check for on prefix
                            // TODO: handle node.type "component"(?) differently
                            const isListener = attribute.key.startsWith('on');
                            if (isListener) {
                                const statement: EventListenerAttachingStatement = {
                                    type: "event-listener",
                                    node: accessor.name,
                                    event: '"' + attribute.key.slice(2) + '"',
                                    // TODO: validate if this is a function or not
                                    listenerFn: attribute.expression
                                };
                                out.push(statement);
                            } else {
                                // do the same as below   
                                const { accessor } = getOrCreateAccessor();
                                out.push({
                                    type: "template-effect",
                                    body: [
                                        {
                                            type: "attribute-updating",
                                            accessor: accessor.name,
                                            texts: [
                                                {
                                                    type: "interpolation",
                                                    body: attribute.expression,
                                                }
                                            ],
                                            key: attribute.key
                                        }
                                    ]
                                });
                            }
                        }
                    } else {
                        const isInterpolated = attribute.texts.some(it => it.type === "interpolation");

                        if (isInterpolated) {
                            const { accessor } = getOrCreateAccessor();
                            out.push({
                                type: "template-effect",
                                body: [
                                    {
                                        type: "attribute-updating",
                                        accessor: accessor.name,
                                        key: attribute.key,
                                        texts: attribute.texts
                                    }
                                ]
                            });
                        }
                    }
                }

                const statements = node.children.map(it => walk(it, [node, ...parents]));
                out.push(...statements.flat());
            }

            out.sort((a, b) => priority(a) - priority(b));
            return out;
        };

        const componentRoots = this.roots.filter(it => !(it.type === "element" && it.tag === "script"));

        const pseudoRoot: Element = {
            type: "element",
            tag: "$$root",
            attributes: [],
            isSelfClosing: false,
            children: componentRoots
        };

        const { name, statement } = this.createTemplateDefinition(pseudoRoot);
        statements.push(statement);
        const { name: rootFragmentName, accessor: rootAccessor } = this.createTemplateInit(pseudoRoot, name);

        let scope: TemplateScopeStatement = {
            type: 'template-scope',
            body: [
                rootAccessor,
                {
                    type: "user-script",
                    body: userScript
                },
                ...walk(pseudoRoot, [pseudoRoot]),
                {
                    type: "append",
                    anchor: "$$context.anchor",
                    node: rootFragmentName
                }
            ]
        };


        return {
            roots: statements,
            generated: scope
        };
    }

    private createTemplateDefinition(node: (ControlFlowNode | Element)) {
        const name = this.createIdentifier("template");
        const statement: TemplateDefinitionStatement = {
            type: "template-definition",
            name,
            template: stringify(node.children)
        };
        return {
            name,
            statement
        };
        // this.accessors.set(node, root)
    }

    private createTemplateInit(rootNode: (ControlFlowNode | Element), templateName: string) {
        const name = this.createIdentifier("root");
        const accessor: TemplateInitStatement = {
            type: "template-init",
            name,
            templateName
        };
        this.accessors.set(rootNode, accessor);
        return {
            name,
            accessor
        };
    }

    private createIdentifier(name: string) {
        let _name = name;
        let i = 1;
        while (this.identifiers.has(_name)) { // Optimize: cache this
            _name = `${name}_${i}`;
            i += 1;
        }
        this.identifiers.add(_name);
        return _name;
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
        let previous: AccessorDefinitionStatement[] = [];
        if (!parentAccessor) {
            // console.log(immediateParent, rest)
            previous = this.createAccessor(immediateParent, rest);
            parentAccessor = previous.at(-1)!;
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
        };
        this.accessors.set(node, accessor);
        return [...previous, accessor];
    }

    private transformScript() {
        let rawScript = this.parseScript();
        const program = acorn.parse(rawScript, {
            ecmaVersion: "latest",
            sourceType: "module"
        });
        const { globals, map, scope } = analyze(program as Node);

        const { importStatements, script } = this.transformImport(program, rawScript);
        this.identifiers = scope.references;

        return {
            importStatements,
            script
        };
    }

    private transformImport(program: acorn.Program, script: string) {
        const toRemove: Node[] = [];
        const importStatements: SwayStatement[] = [
            {
                type: "any",
                body: "import * as $ from 'sway/runtime';"
            }
        ];

        walk(program as Node, {
            enter(node, parent, key, index) {
                if (node.type === "ImportDeclaration") {
                    // i kinda get why they dont use ts in svelte 5 compiler now
                    // type N = Node & { start: number, end: number }
                    toRemove.push(node);
                    importStatements.push({
                        type: "estree",
                        node: node
                    });
                }
            }
        });

        // bruh 
        // TODO: fix this 
        toRemove.reverse();
        for (const { start, end } of toRemove as (Node & { start: number, end: number; })[]) {
            script = script.substring(0, start) + script.substring(end);
        }

        return {
            script,
            importStatements,
        };
    }

    // private parseIdentifiers() {

    // }

    private parseBinding(rawExpression: string): Binding {
        const { body } = acorn.parse(rawExpression, {
            ecmaVersion: "latest",
            sourceType: "module",
        });

        if (body.length !== 1) {
            // TODO: better error handling, at line
            throw new Error(`Invalid binding: ${rawExpression}`);
        }

        const statement = body[0];
        if (statement.type !== "ExpressionStatement") {
            throw new Error(`Invalid binding: binding must be expression: ${rawExpression}`);
        }

        const expression = statement.expression;
        // bind:value={signal.value}
        if (expression.type === "MemberExpression") {
            return {
                kind: "variables",
                name: rawExpression
            };
        }

        // bind:value={getter, setter}
        if (expression.type === "SequenceExpression") {
            if (expression.expressions.length !== 2) {
                throw new Error(`Invalid binding: binding must be in this form: {getter, setter} | ${rawExpression}`);
            }
            const splitter = expression.expressions[0].end;
            const getter = rawExpression.slice(0, splitter);
            const setter = rawExpression.slice(splitter + 1);
            // we dont type check it, TODO: might do later tho
            return {
                kind: "functions",
                getter,
                setter
                // getter: escodegen.generate(getter)
                // setter: escodegen.generate(setter)
            };
        }

        throw new Error(`Invalid binding: unsupport expression type ${expression.type} | ${rawExpression}`);
    }

    private parseScript(): string {
        const script = this.roots.find(it => it.type === "element" && it.tag === "script") as Element | undefined;
        if (!script || script.children.length !== 1 || script.children[0].type !== "text") {
            return "";
        }
        return script.children[0].texts[0].body;
    }

    build() {
        const root = this.transform();
        // output += this.topLevelStatements
        // console.log(root)
        const output = generate(root, 0, this.options.logging);
        // console.log(this.accessors)
        // console.log(output)
        return {
            ast: root, // i should call this something else
            output,
        };
    }
}
