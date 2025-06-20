import { TemplateAST } from "../parse/ast";
import { transform as clientTransform } from "./client";
import type { TransformOptions as ClientTransformOptions } from "./client/transformer";

type TransformOptions = ClientTransformOptions & {
    target?: "client" | "server";
};

export function transform(ast: TemplateAST, options: Partial<TransformOptions>) {
    return clientTransform(ast, options);
}

