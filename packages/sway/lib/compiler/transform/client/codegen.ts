import * as escodegen from "escodegen";
import { Attribute, TemplateASTNode, TemplateASTNodeWithRoot, TextOrInterpolation } from "../../parse/ast";
import { unreachable } from "../../utils";
import { Binding, SwayStatement } from "./statements";


export function generateMany(statements: SwayStatement[], indentation: number, logging = false) {
    return statements.map(it => generate(it, indentation, logging)).join('');
}

export function generate(statement: SwayStatement, indentation: number = 0, logging = false): string {
    let out = "";
    function add(string: string, more = 0) {
        out += ' '.repeat(indentation + more) + string + '\n';
    }

    function log(statement: SwayStatement, message = "") {
        if (logging) {
            add(`/* ${statement.type}: ${message} */`);
        }
    }

    log(statement);

    switch (statement.type) {
        case "component-declaration": {
            const { body, name, after, before } = statement;
            add(generateMany(before, indentation, logging));

            add(`export default function ${name}({ $$anchor, $$slots, $$props, $$runtime }) {`);
            add(`$.push();`, 2);
            add(`const $$exports = {};`, 2);
            add(generateMany(body, indentation, logging));
            add(`$.pop();`, 2);
            add(`return $$exports;`, 2);
            add(`}`);

            add(generateMany(after, indentation, logging));
            break;
        }

        case "component-initialization": {
            const { instanceName, componentName, props, slots, anchor } = statement;
            if (instanceName) {
                add(`const ${instanceName} = ${componentName}({`);
            } else {
                add(`${componentName}({`);
            }
            add(`  $$anchor: ${anchor},`);
            add(`  $$props: {`);
            for (const p of props) {
                const c = p.isBinding ? p.binding : p.value;
                add(`    get ${p.key}() {`);
                add(`      return ${generatePropsGetter(c)};`);
                add(`    },`);
                if (p.isBinding) {
                    add(`    set ${p.key}($$value) {`);
                    if (p.binding.kind === "functions") {
                        add(`      ${p.binding.setter}($$value);`);
                    } else {
                        add(`      ${p.binding.name} = $$value;`);
                    }
                    add(`    },`);
                }
            }
            add(`  },`);
            add(`  $$slots: {`);
            for (const slot of slots) {
                add(`    ${slot.name}: (${slot.anchorName ?? '$$anchor'}) => {`);
                add(generateMany(slot.body, 6));
                add(`    },`);
            }
            add(`  },`);
            add(`  $$exports: {},`);
            add(`  $$runtime,`);
            add(`});`);
            break;
        }

        case "bind-this": {
            const { identifier, instanceName } = statement;
            add(`$$runtime.bindThis(($$instance) => { ${identifier} = $$instance; }, ${instanceName});`);
            break;
        }

        case "accessor-definition": {
            const { mode, name, parent, index } = statement;
            // well well well...
            const fn = mode === "children" ? "child" : "sibling";
            add(`const ${name} = $$runtime.${fn}(${parent}, ${index});`);
            break;
        }

        case "estree": {
            // TODO: format this later
            out += escodegen.generate(statement.node, {
                format: {

                }
            }) + '\n\n';
            break;
        }

        case "user-script":
        case "any": {
            add(statement.body);
            add('\n');
            break;
        }

        case "template-scope": {
            const { body } = statement;
            return generateMany(body, indentation, logging);
        }

        case "template-effect": {
            const { body } = statement;
            add('$.templateEffect(() => {');
            add(generateMany(body, indentation + 2, logging));
            add('});');
            break;
        }

        case "text-setting": {
            const { accessor, texts } = statement;
            const code = generateTextInterpolation(texts);
            add(`$$runtime.setText(${accessor}, ${code})`);
            break;
        }

        case "attribute-updating": {
            const { key, accessor, texts } = statement;
            const code = generateTextInterpolation(texts);
            add(`$$runtime.setAttribute(${accessor}, \`${key}\`, ${code})`);
            break;
        }

        case "if": {
            const { condition, anchor, body, blockName, fragment, else: _else } = statement;
            add('');
            add('{');

            add(`const ${blockName} = ($$anchor) => {`, 2);
            add(generateMany(body, indentation + 4, logging));
            add(`$.append($$anchor, ${fragment});`, 4);
            add(`};`, 2);

            if (_else) {
                const { blockName, body, fragment } = _else;
                add(`const ${blockName} = ($$anchor) => {`, 2);
                add(generateMany(body, indentation + 4, logging));
                add(`$.append($$anchor, ${fragment});`, 4);
                add(`};`, 2);
            }

            add('');
            add(`$.if(${anchor}, ($$render) => {`, 2);
            add(`if (${condition}) $$render(${blockName})`, 4);
            if (_else) {
                add(` else $$render(${_else.blockName}, false);`);
            }
            add(`});`, 2);

            add('}');
            break;
        }

        case "template-definition": {
            const { name, template, isCode } = statement;
            if (isCode) {
                add(`const ${name} = $.staticContent(${template});`);
            } else {
                add(`const ${name} = $.staticContent(\`${template}\`);`);
            }
            break;
        }

        case "template-init": {
            const { name, templateName: root } = statement;
            add(`const ${name} = ${root}($$runtime);`);
            break;
        }

        case "append": {
            const { anchor, node } = statement;
            add(`$$runtime.append(${anchor}, ${node});`);
            break;
        }

        case "event-listener": {
            const { event, listenerFn, node } = statement;
            add(`$$runtime.listen(${node}, ${event}, () => ${listenerFn});`);
            break;
        }

        case "each": {
            const { body, anchor, iteratable, as, key, index, fragment } = statement;
            let asAndIndex = '';
            if (as) {
                asAndIndex += as;
                if (index) {
                    asAndIndex += `, ${index}`;
                }
            }

            add(`$$runtime.each(${anchor}, () => ${iteratable}, ($$anchor, ${asAndIndex}) => {`);
            add(generateMany(body, indentation + 2, logging));
            add(`$$runtime.append($$anchor, ${fragment});`, 2);
            if (key) {
                add(`}, (${asAndIndex}) => ${key});`);
            } else {
                add(`});`);
            }
            break;
        }

        case "binding": {
            const { key, node, binding } = statement;
            let getter: string;
            let setter: string;
            if (binding.kind === "variables") {
                getter = `() => ${binding.name}`;
                setter = `($$value) => (${binding.name} = $$value)`;
            } else {
                getter = binding.getter;
                setter = binding.setter;
            }
            add(`$$runtime.bind(${node}, \`${key}\`, ${getter}, ${setter})`);
            break;
        }

        case "key": {
            throw new Error("key is not implemented yet");
            break;
        }

        default: {
            unreachable();
        }
    }

    return out;
}

function generatePropsGetter(input: Binding | string | TextOrInterpolation[]) {
    if (typeof input === "string") {
        return input;
    }

    if (Array.isArray(input)) {
        return generateTextInterpolation(input);
    }

    if (input.kind === "functions") {
        return `${input.getter}()`;
    }

    return input.name;
}

export function generateTextInterpolation(texts: TextOrInterpolation[]): string {
    let code = '`';
    // console.log(texts)
    for (const { body, type } of texts) {
        if (type === "static") {
            code += body;
        } else {
            code += '${';
            code += body;
            code += '}';
        }
    }
    code += '`';
    return code;
}

export function stringifyAttributes(attributes: Attribute[]): string {
    let out = "";
    for (const attribute of attributes) {
        if (attribute.whole) {
            // it will be handle by code generated by the transformer
            // TODO: we might check if its static or not
            continue;
        }
        const isDynamic = attribute.texts.some(it => it.type === "interpolation");
        if (isDynamic) {
            // same
            continue;
        }
        // TODO: escape " and '
        out += ` ${attribute.key}="${attribute.texts.map(it => it.body).join()}"`;
    }
    return out;
}

export function stringify(nodes: TemplateASTNodeWithRoot[]): string {
    return nodes.map(stringifyNode).join('');
}

// TODO: we shuold run create root only once
export function stringifyNode(node: TemplateASTNodeWithRoot) {
    if (node.type === "control-flow") {
        // hole!!
        return '<!>';
        // if (node.kind === "if") {
        //     if (node.elseChildren.length !== 0) {
        //         return `<!-- if --><!-- else -->`
        //     }
        //     return `<!-- if -->`
        // } else {
        //     return `<!-- each -->`
        // }
    }

    if (node.type === "root") {
        return stringify(node.children);
    }

    if (node.type === "component") {
        return '<!>';
    }

    if (node.type === "element") {
        const attribute = stringifyAttributes(node.attributes);
        if (node.isSelfClosing) {
            return `<${node.tag}${attribute}/>`;
        }
        return `<${node.tag}${attribute}>${stringify(node.children)}</${node.tag}>`;
    }

    const isDynamic = node.texts.some(it => it.type === "interpolation");
    if (isDynamic) {
        return " ";
    } else {
        return node.texts.map(it => it.body).join('');
    }
}

function generateAttributesInitInstructions(nodeName: string, attributes: Attribute[]) {
    let out = "";
    for (const attribute of attributes) {
        if (attribute.whole) {
            // it will be handle by code generated by the transformer
            // TODO: we might check if its static or not
            continue;
        }
        const isDynamic = attribute.texts.some(it => it.type === "interpolation");
        if (isDynamic) {
            // same
            continue;
        }
        // TODO: escape " and 
        out += `$$runtime.setAttribute(${nodeName}, \`${attribute.key}\`, \`${attribute.texts.map(it => it.body).join()}\`);\n`;
    }
    return out;
}

export function generateTemplateInitInstructions(nodes: TemplateASTNode[]) {
    let code = `($$runtime) => {\n`;
    code += `const nodes = [];\n`;
    const identifiers = new Set();

    function createIdentifier(preferredName: string): string {
        let name = preferredName;
        let counter = 0;
        while (identifiers.has(name)) {
            counter++;
            name = `${preferredName}_${counter}`;
        }
        identifiers.add(name);
        return name;
    }

    function generateTemplate(nodes: TemplateASTNode[], targetArray: string) {
        let output = "";
        for (const node of nodes) {
            const preferredName = node.type === "text"
                ? "text"
                : node.type === "control-flow"
                    ? `${node.kind}_anchor`
                    : node.type === "component"
                        ? `${node.name}_anchor`
                        : node.tag;
            const nodeName = createIdentifier(preferredName);

            if (node.type === "component" || node.type === "control-flow") {
                output += `  const ${nodeName} = $$runtime.comment();\n`;
            } else if (node.type === "text") {
                const isDynamic = node.texts.some(it => it.type === "interpolation");
                let text = " ";
                if (!isDynamic) {
                    text = node.texts.map(it => it.body).join('');
                }
                output += `  const ${nodeName} = $$runtime.createText(\`${text}\`);\n`;
            } else {
                output += `  const ${nodeName} = $$runtime.createElement(\`${node.tag}\`);\n`;
                output += `  const ${nodeName}_children = [];`;
                output += generateAttributesInitInstructions(nodeName, node.attributes);
                output += `{\n`;
                output += generateTemplate(node.children, `${nodeName}_children`);
                output += `${nodeName}_children.forEach(it => $$runtime.appendChild(${nodeName}, it))\n`;
                output += `}\n`;
            }
            output += `  ${targetArray}.push(${nodeName});\n`;
        }

        return output;
    }

    code += generateTemplate(nodes, "nodes");
    code += `  return nodes;\n`;
    code += `}\n`;

    return code;
}
