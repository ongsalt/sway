import { TagName } from "../types";
import { TuanTextNode } from "./parser";

export class Codegen {
    // Should be a map of name and static node

    constructor(public references: Set<string>) {

    }

    template(html: string) {
        return `const createRoot = $.template(\`${html}\`);\n`
    }

    append(anchor: string = '$$context.anchor') {

    }

    accessor(tagName: TagName, path: number[], root: string) {
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
            statement: `const ${name} = $.at(${root}, [${path.toString()}]);\n`
        }
    }

    templateEffect(inner: string) {
        return `$.templateEffect(${inner});\n`
    }

    textEffect(nodeName: string, template: string) {
        return this.templateEffect(`() => $.setText(${nodeName}, ${template})`)
    }

    interpolation(texts: TuanTextNode[]) {
        let code = '`'
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