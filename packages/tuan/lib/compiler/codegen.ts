import { NodeCount } from "../types";
import { TuanTextNode } from "./parser";

export function generateTextAccessor(nodeCount: NodeCount, path: number[]) {
    
}

export function generateTemplateEffect() {

}

export function generateInterpolation(texts: TuanTextNode[]) {
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