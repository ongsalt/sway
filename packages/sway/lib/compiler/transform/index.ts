import { TemplateAST } from "../parse/ast";
import { transform as clientTransform, ClientTransformOptions } from "./client";
import * as acorn from "acorn";
import * as escodegen from "escodegen";

export type TransformOptions = ClientTransformOptions & {
    target?: "client" | "server";
};

export function transform(ast: TemplateAST, options: Partial<TransformOptions>) {
    const o = clientTransform(ast, options);

    return {
        output: format(o.output),
        ast: o.ast
    };
}

function format(code: string) {
    // return code;
    const program = acorn.parse(code, {
        // todo: parse an options
        ecmaVersion: "latest",
        sourceType: "module"
    });

    return escodegen.generate(program);
}
