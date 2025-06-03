import { TemplateASTNode } from "../parse/ast";
import { Transformer, TransformOptions } from "./transformer";

export function transform(roots: TemplateASTNode[], options: Partial<TransformOptions>) {
    const transformer = new Transformer(roots, options)
    return transformer.build()
}
