import { ASTNode, Attribute } from "../parse/ast";

export function parseRoots(node: ASTNode): Record<string, string> {

}

export function stringifyAttributes(attributes: Attribute[]): string {
    let out = ""
    for (const attribute of attributes) {
        if (attribute.whole) {
            continue
        }
        const isDynamic = attribute.texts.some(it => it.type === "interpolation")
        if (isDynamic) {
            continue
        }
        // TODO: escape " and '
        out += ` ${attribute.key}="${attribute.texts.map(it => it.body).join()}"`
    }
    return out
}

export function stringify(node: ASTNode): string {
    if (node.type === "control-flow") {
        if (node.kind === "if") {
            if (node.elseChildren.length !== 0) {
                return `<!-- if --><!-- else -->`
            }
            return `<!-- if -->`
        } else {
            return `<!-- each -->`
        }
    } else if (node.type === "element") {
        if (node.isSelfClosing) {
            return `<${node.tag}/>`
        }
        return `<${node.tag}${stringifyAttributes(node.attributes)}>${node.children.map(stringify).join('')}</${node.tag}>`
    } else {
        const isDynamic = node.texts.some(it => it.type === "interpolation")
        if (isDynamic) {
            return " "
        } else {
            return node.texts.map(it => it.body).join('')
        }
    }
}