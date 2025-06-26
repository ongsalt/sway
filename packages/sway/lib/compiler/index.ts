import { parse } from "./parse";
import { transform, TransformOptions } from "./transform";

export type CompilerOptions = TransformOptions;

export function compile(source: string, options: Partial<CompilerOptions> = {}) {
    const nodes = parse(source);
    const output = transform(nodes, {
        ...options
    });

    // console.log(output)

    return output;
}
