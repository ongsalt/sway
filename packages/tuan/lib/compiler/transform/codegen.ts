import { TextOrInterpolation } from "../parse/ast";
import { TuanStatement } from "./statements";
import * as escodegen from "escodegen";


export function generateMany(statements: TuanStatement[], indentation: number, logging = false) {
    return statements.map(it => generate(it, indentation, logging)).join('')
}

export function generate(statement: TuanStatement, indentation: number, logging = false): string {
    let out = "";
    function add(string: string, more = 0) {
        out += ' '.repeat(indentation + more) + string + '\n';
    }

    function log(statement: TuanStatement, message = "") {
        if (logging) {
            add(`/* ${statement.type}: ${message} */`)
        }
    }

    log(statement);

    switch (statement.type) {
        case "component-declaration": {
            const { fn, after, before } = statement;
            add(generateMany(before, indentation, logging));
            add(generate(fn, indentation, logging));
            add(generateMany(after, indentation, logging));
            break;
        }

        case "component-function": {
            const { body, name } = statement;
            add(`export default function ${name}($$context) {`)
            add(generateMany(body, indentation + 2, logging));
            add(`}`)
            break;
        }

        case "accessor-definition": {
            const { mode, name, parent, index } = statement;
            // well well well...
            const fn = mode === "children" ? "children" : "sibling"
            add(`const ${name} = $.${fn}(${parent}, ${index});`)
            break;
        }

        case "estree": {
            // TODO: format this later
            out += escodegen.generate(statement.node, {
                format: {

                }
            }) + '\n\n'
            break
        }

        case "user-script":
        case "any": {
            add(statement.body);
            add('\n');
            break
        }

        case "template-scope": {
            const { body } = statement;
            return generateMany(body, indentation, logging)
        }

        case "template-effect": {
            const { body } = statement
            add('$.templateEffect(() => {')
            add(generateMany(body, indentation + 2, logging))
            add('});')
            break
        }

        case "text-setting": {
            const { accessor, texts } = statement
            const code = generateTextInterpolation(texts)
            add(`$.setText(${accessor}, ${code})`)
            break
        }

        case "if": {
            const { condition, anchor, body, blockName, fragment, else: _else } = statement;
            add('')
            add('{')

            add(`const ${blockName} = ($$anchor) => {`, 2)
            add(generateMany(body, indentation + 4, logging))
            add(`$.append($$anchor, ${fragment});`, 4)
            add(`};`, 2)

            if (_else) {
                const { blockName, body, fragment } = _else;
                add(`const ${blockName} = ($$anchor) => {`, 2)
                add(generateMany(body, indentation + 4, logging))
                add(`$.append($$anchor, ${fragment});`, 4)
                add(`};`, 2)
            }

            add('')
            add(`$.if(${anchor}, ($$render) => {`, 2)
            add(`if (${condition}) $$render(${blockName})`, 4)
            if (_else) {
                add(` else $$render(${_else.blockName}, false);`)
            }
            add(`});`, 2)

            add('}')
            break
        }

        case "template-root": {
            const { name, template } = statement
            add(`const ${name} = $.template(\`${template}\`);`)
            break
        }

        case "create-root": {
            const { name, root } = statement
            add(`const ${name} = ${root}();`)
            break
        }

        case "append": {
            const { anchor, node } = statement
            add(`$.append(${anchor}, ${node});`)
            break
        }

        case "event-listener": {
            const { event, listenerFn, node } = statement
            // shuold we move this under an effect?
            // or remove component context and add fragmentContext??
            add(`$.listen(${node}, ${event}, ${listenerFn});`)
            break
        }

        case "each": {
            const { body, anchor, iteratable, as, key, index, fragment } = statement
            let asAndIndex = ''
            if (as) {
                asAndIndex += as;
                if (index) {
                    asAndIndex += `, ${index}`
                }
            }

            add(`$.each(${anchor}, () => ${iteratable}, ($$anchor, ${asAndIndex}) => {`)
            add(generateMany(body, indentation + 2, logging))
            add(`$.append($$anchor, ${fragment});`, 2)
            if (key) {
                add(`}, (${asAndIndex}) => ${key});`)
            } else {
                add(`});`)
            }
            break
        }

        case "attribute-updating": {
            const { isFunction, key, target, type } = statement
            // throw new Error("Unimplemented (codegen)")
            break
        }

        case "binding": {
            const { key, node, target } = statement;
            add(`$.bind(${node}, \`${key}\`, ${target})`)
            break
        }

        default: {
            // return new Error("smdjfnuik")
            throw new Error("Unimplemented (codegen)")
            add(`/* ${statement.type} is not implement yet. */`)
        }
    }

    return out;
}

export function generateTextInterpolation(texts: TextOrInterpolation[]): string {
    let code = '`'
    // console.log(texts)
    for (const { body, type } of texts) {
        if (type === "static") {
            code += body
        } else {
            code += '${'
            code += body
            code += '}'
        }
    }
    code += '`'
    return code
}
