import { TemplateAST } from "../parse/ast";
import { transform as clientTransform, ClientTransformOptions } from "./client";

type TransformOptions = ClientTransformOptions & {
    target?: "client" | "server";
};

export function transform(ast: TemplateAST, options: Partial<TransformOptions>) {
    return clientTransform(ast, options);
}

