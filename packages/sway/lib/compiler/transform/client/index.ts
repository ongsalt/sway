import * as acorn from "acorn";
import { Node } from "estree";
import { walk } from "estree-walker";
import { analyze } from "periscopic";
import { Attribute, ControlFlowNode, ElementNode, Parent, TemplateAST, TemplateASTNodeWithRoot, TextNode, TextOrInterpolation } from "../../parse/ast";
import { unreachable } from "../../utils";
import { generate, generateTemplateInitInstructions, stringify } from "./codegen";
import { AccessorDefinitionStatement, Binding, ComponentDeclarationStatement, priority, Prop, SwayStatement, TemplateDefinitionStatement, TemplateEachStatement, TemplateIfStatement } from "./statements";

export type ClientTransformOptions = {
  name: string,
  ecmaVersion: string,
  logging: boolean;
  staticTemplateParsing: boolean;
};

export function transform(root: TemplateAST, _options: Partial<ClientTransformOptions> = {}) {
  const options: ClientTransformOptions = {
    name: _options.name ?? "Component",
    ecmaVersion: _options.ecmaVersion ?? "2022",
    logging: _options.logging ?? false,
    staticTemplateParsing: _options.staticTemplateParsing ?? true
  };

  const script = extractScript(root.script);
  const { importStatements, script: userScript, scope } = transformScript(script);

  // for control flow node its a fragment not a node
  const templateNames = new Map<TemplateASTNodeWithRoot, string>();
  const accessorNames = new Map<TemplateASTNodeWithRoot, string>();
  const identifiers = createIdentifierMap(scope.references);

  function createIdentifier(name: string, meta?: IdentifierMeta) {
    let _name = name;
    let i = 1;
    while (identifiers.has(_name)) { // Optimize: cache this
      _name = `${name}_${i}`;
      i += 1;
    }
    identifiers.set(_name, meta ?? { type: "unknown" });
    return _name;
  }

  function getOrCreateAccessor(node: TemplateASTNodeWithRoot): { name: string, statements: SwayStatement[]; } {
    const statements: SwayStatement[] = [];

    const existing = accessorNames.get(node);
    if (existing) {
      return {
        name: existing,
        statements
      };
    }

    if (node.type === "root") {
      // this shuold be set in createFragmentInit
      unreachable();
    }

    // if (node.type === "component") {
    //   throw new Error("TODO: component");
    // }

    if (!node.parent) {
      throw new Error("parent is component root");
    }

    const parent = getOrCreateAccessor(node.parent);

    const preferredName = node.type === "text"
      ? "text"
      : node.type === "control-flow"
        ? `${node.kind}_anchor`
        : node.type === "component"
          ? `${node.name}_anchor`
          : node.tag;
    const name = createIdentifier(preferredName);

    const accessor: AccessorDefinitionStatement = {
      type: "accessor-definition",
      mode: "children",
      parent: parent.name,
      index: node.parent.children.findIndex(it => it === node),
      name,
    };

    accessorNames.set(node, name);

    return {
      name,
      statements: [...parent.statements, accessor]
    };
  }

  function createFragmentInit(node: TemplateAST | ControlFlowNode) {
    const preferredName = node.type === "root" ? "root_fragment" : `${node.kind}_fragment`;
    const name = createIdentifier(preferredName);
    accessorNames.set(node, name);
    return {
      name,
      statements: [
        {
          type: "template-init",
          name,
          templateName: templateNames.get(node)!
        }
      ] as SwayStatement[]
    };
  }

  function transformTemplate(root: TemplateAST) {
    const before: SwayStatement[] = [];

    const rootTemplate = createTemplateDefinitions(root);

    // walk it, find hole and create $.staticContent()
    // also create intepolation
    // we do everything in 1 pass
    function walk(node: TemplateASTNodeWithRoot): SwayStatement[] {
      const out: SwayStatement[] = [];
      if (node.type === "text") {
        if (isDynamic(node.texts)) {
          const { name, statements } = getOrCreateAccessor(node);
          const s = createTextInterpolationEffect(name, node);
          out.push(...statements, s);
        }
      }

      if (node.type === "element") {
        const _statements: SwayStatement[] = [];
        const accessor = getOrCreateAccessor(node);

        const bindThis = node.attributes.find(it => it.key === "this" && it.whole && it.isBinding);
        const rest = node.attributes.filter(it => it !== bindThis);

        for (const attr of rest) {
          const s = createAttributeEffect(accessor.name, attr);
          _statements.push(...s);
        }

        if (bindThis) {
          _statements.push({
            type: "bind-this",
            identifier: (bindThis as any).expression,
            instanceName: accessor.name
          });
        }

        // TODO: prune unused
        out.push(...accessor.statements, ..._statements);
        out.push(...node.children.flatMap(c => walk(c)));
      }

      if (node.type === "control-flow") {
        if (node.kind === "if") {
          createTemplateDefinitions(node);
          const accessor = getOrCreateAccessor(node);

          const fragment = createFragmentInit(node);
          const ifStatement: TemplateIfStatement = {
            type: "if",
            condition: node.condition,
            anchor: accessor.name,
            fragment: fragment.name,
            body: [
              ...fragment.statements,
              ...node.children.flatMap(it => walk(it))
            ],
            blockName: createIdentifier("then"),
          };

          const _else = node.else;
          if (_else) {
            createTemplateDefinitions(_else);
            const fragment = createFragmentInit(_else);

            ifStatement.else = {
              blockName: createIdentifier("alternative"),
              body: [
                ...fragment.statements,
                ..._else.children.flatMap(c => walk(c))
              ],
              fragment: fragment.name
            };
          }

          out.push(...accessor.statements, ifStatement);
        }

        if (node.kind === "else") {
          unreachable("this is not possible unless the parser got high or something");
        }

        if (node.kind === "each") {
          createTemplateDefinitions(node);
          const accessor = getOrCreateAccessor(node);
          const fragment = createFragmentInit(node);

          const eachStatement: TemplateEachStatement = {
            type: "each",
            anchor: accessor.name,
            iteratable: node.iteratable,
            as: node.as,
            index: node.index,
            key: node.key,
            fragment: fragment.name,
            body: [
              ...fragment.statements,
              ...node.children.flatMap(it => walk(it))
            ],
          };

          out.push(...accessor.statements, eachStatement);
        }
      }

      if (node.type === "component") {
        createTemplateDefinitions(node);
        const accessor = getOrCreateAccessor(node); // the anchor
        const bindThis = node.props.find(it => it.key === "this" && it.whole && it.isBinding);
        const rest = node.props.filter(it => it !== bindThis);
        let instanceName: string | undefined = undefined;
        if (bindThis) {
          instanceName = createIdentifier(`${node.name}_instance`);
        }

        out.push(...accessor.statements);
        out.push({
          type: "component-initialization",
          componentName: node.name,
          anchor: accessor.name,
          instanceName,
          props: toProps(rest),
          slots: [
            {
              name: "children",
              body: node.children.flatMap(c => walk(c))
            }
          ]
        });

        if (bindThis) {
          out.push({
            type: "bind-this",
            instanceName: instanceName!,
            identifier: (bindThis as any).expression
          });
        }
      }

      if (node.type === "root") {
        const { statements, name } = createFragmentInit(node);
        out.push(...statements);
        out.push(...node.children.flatMap(c => walk(c)));
        out.push({
          type: "append",
          anchor: "$$anchor",
          node: name
        });
      }

      out.sort((a, b) => priority(a) - priority(b));
      return out;
    }

    function createTemplateDefinitions(node: Parent) {
      const preferredName = node.type === "control-flow"
        ? `template_${node.kind}`
        : node.type === "component"
          ? `template_${node.name}`
          : `template`;
      const name = createIdentifier(preferredName);
      templateNames.set(node, name);
      const statement: TemplateDefinitionStatement = {
        type: "template-definition",
        name,
        isCode: !options.staticTemplateParsing,
        template: options.staticTemplateParsing ? stringify(node.children) : generateTemplateInitInstructions(node.children) //
      };
      before.push(statement);
      return {
        name,
        statement
      };
    }

    const statements = walk(root);

    return {
      before,
      body: statements
    };
  }

  const { before, body } = transformTemplate(root);

  const declaration: ComponentDeclarationStatement = {
    type: "component-declaration",
    name: options.name,
    before: [...importStatements, ...before],
    body: [
      {
        type: "user-script",
        body: userScript
      },
      ...body
    ],
    after: []
  };

  const output = generate(declaration);
  return {
    output,
    ast: declaration
  };
}

function createTextInterpolationEffect(accessorName: string, node: TextNode): SwayStatement {
  return {
    type: "template-effect",
    body: [
      {
        type: "text-setting",
        accessor: accessorName,
        texts: node.texts
      }
    ]
  };
}

function createAttributeEffect(accessorName: string, attribute: Attribute): SwayStatement[] {
  if (attribute.whole) {
    if (attribute.isBinding) { // bind:
      return [
        {
          type: "binding",
          key: attribute.key,
          node: accessorName,
          binding: parseBinding(attribute.expression)
        }
      ];
    } else {
      // determine if this is a listener or not
      // i will just check for on prefix
      // TODO: handle node.type "component"(?) differently
      const isListener = attribute.key.startsWith('on');
      if (isListener) {
        return [
          {
            type: "event-listener",
            node: accessorName,
            event: '"' + attribute.key.slice(2) + '"',
            // TODO: validate if this is a function or not
            listenerFn: attribute.expression
          }
        ];
      }

      return [
        {
          type: "template-effect",
          body: [
            {
              type: "attribute-updating",
              accessor: accessorName,
              texts: [
                {
                  type: "interpolation",
                  body: attribute.expression,
                }
              ],
              key: attribute.key
            }
          ]
        }
      ];
    }
  } else {
    const isInterpolated = attribute.texts.some(it => it.type === "interpolation");

    if (isInterpolated) {
      return [
        {
          type: "template-effect",
          body: [
            {
              type: "attribute-updating",
              accessor: accessorName,
              key: attribute.key,
              texts: attribute.texts
            }
          ]
        }
      ];
    }
  }

  return [];
}


function toProps(attributes: Attribute[]): Prop[] {
  return attributes.map((attr): Prop => {
    if (attr.whole) {
      if (attr.isBinding) {
        return {
          key: attr.key,
          isBinding: true,
          binding: parseBinding(attr.expression)
        };
      }
      return {
        key: attr.key,
        isBinding: false,
        value: attr.expression,
      };
    }
    return {
      key: attr.key,
      isBinding: false,
      value: attr.texts
    };
  });
}

function isDynamic(texts: TextOrInterpolation[]) {
  return texts.some(it => it.type === "interpolation");
}

type IdentifierMeta = {
  type: "unknown";
} | {
  type: "node";
  node: number;
};

function createIdentifierMap(preexisting: Set<string>) {
  const map = new Map<string, IdentifierMeta>();

  for (const name of preexisting) {
    map.set(name, { type: "unknown" });
  }

  return map;
}

function extractScript(element?: ElementNode) {
  if (!element) {
    return "";
  }
  if (element.children.length !== 1 || element.children[0].type !== "text") {
    throw new Error(`wtf, parsing error???: ${JSON.stringify(element)}`);
  }

  return element.children[0].texts[0].body;
}

// TODO: properly transform this
function transformScript(script: string) {
  const program = acorn.parse(script, {
    ecmaVersion: "latest",
    sourceType: "module"
  });
  const { globals, map, scope } = analyze(program as Node);

  const { importStatements, rest } = extractImport(program, script);

  return {
    importStatements,
    script: rest,
    scope,
    globals,
    map
  };

}

function extractImport(program: acorn.Program, script: string) {
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

  toRemove.reverse();
  for (const { start, end } of toRemove as (Node & { start: number, end: number; })[]) {
    script = script.substring(0, start) + script.substring(end);
  }

  return {
    rest: script,
    importStatements,
  };
}

function parseBinding(rawExpression: string): Binding {
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
  if (expression.type === "MemberExpression" || expression.type === "Identifier") {
    // TODO: should we allow identifier tho
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
