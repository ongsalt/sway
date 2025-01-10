import { TagName } from "../types";
import { TuanTextNode } from "./parser";

export class Codegen {
    // Should be a map of name and static node

    constructor(public references: Set<string>) {

    }

    has(identifier: string) {
        return this.references.has(identifier)
    }

    template(html: string) {
        const escaped = html.replace("$", "\\$")
        return `const createRoot = $.template(\`${html}\`);\n`
    }

    append(anchor: string = '$$context.anchor') {

    }

    accessor(tagName: TagName, path: number[], root: string, type: "node" | "element") {
        let name: string = tagName
        let i = 2
        while (this.references.has(name)) { // Optimize: cache this
            name = `${tagName}_${i}`
            i += 1;
        }
        this.references.add(name)
        return {
            name,
            index: i,
            statement: `const ${name} = $.${type}At(${root}, [${path.toString()}]);\n`
        }
    }

    templateEffect(inner: string) {
        return `$.templateEffect(${inner});\n`
    }

    textEffect(nodeName: string, template: string) {
        return this.templateEffect(`() => $.setText(${nodeName}, ${template})`)
    }
    
    attrEffect(nodeName: string, attributes: string, expression: string) {
        return this.templateEffect(`() => $.setAttribute(${nodeName}, "${attributes}", ${expression})`)
    }

    listener(nodeName: string, type: string, expression: string) {
        return `$.setListener(${nodeName}, "${type}", ${expression});\n`
    }

    stringInterpolation(texts: TuanTextNode[]) {
        let code = '`'
        console.log(texts)
        for (const { body, type } of texts) {
            if (type === "text") {
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

    mount(root: string) {

    }
}