import { parse } from "./parse";
import { transform } from "./transform";

export type CompilerOptions = {
    name?: string,
    ecmaVersion?: string;
};

export function compile(source: string, options: CompilerOptions = {}) {
    const nodes = parse(source);
    const output = transform(nodes, {
        ...options
    });

    return output;
}