import { TemplateASTNode, Attribute } from "../parse/ast";

export function stringifyAttributes(attributes: Attribute[]): string {
    let out = ""
    for (const attribute of attributes) {
        if (attribute.whole) {
            continue
        }
        const isDynamic = attribute.texts.some(it => it.type === "interpolation")
        if (isDynamic) {
            console.log(attribute.texts)
            continue
        }
        // TODO: escape " and '
        out += ` ${attribute.key}="${attribute.texts.map(it => it.body).join()}"`
    }
    return out
}

export function stringify(nodes: TemplateASTNode[]): string {
    return nodes.map(stringifyNode).join('')
}

function stringifyNode(node: TemplateASTNode) {
    if (node.type === "control-flow") {
        return '<!>'
        // if (node.kind === "if") {
        //     if (node.elseChildren.length !== 0) {
        //         return `<!-- if --><!-- else -->`
        //     }
        //     return `<!-- if -->`
        // } else {
        //     return `<!-- each -->`
        // }
    } else if (node.type === "element") {
        const attribute = stringifyAttributes(node.attributes)
        if (node.isSelfClosing) {
            return `<${node.tag}${attribute}/>`
        }
        return `<${node.tag}${attribute}>${stringify(node.children)}</${node.tag}>`
    } else {
        const isDynamic = node.texts.some(it => it.type === "interpolation")
        if (isDynamic) {
            return " "
        } else {
            return node.texts.map(it => it.body).join('')
        }
    }
}