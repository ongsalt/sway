// I LOVE TAGGED UNION

export type Attribute = {
    key: string,
} & (
        {
            whole: true, // for key={}
            expression: string
        } | {
            whole: false, // for key="something-{}"
            texts: TextOrInterpolation[]
        }
    )

export type TextOrInterpolation = {
    type: "static" | "interpolation"
    body: string
}

export type TextNode = {
    type: "text",
    texts: TextOrInterpolation[]
}

// we gonna make if/else block behave like a node
export type IfNode = {
    type: "control-flow"
    kind: "if",
    condition: string
    children: TemplateASTNode[],
    else?: ElseNode
}

// just for the transformer
export type ElseNode = {
    type: "control-flow"
    kind: "else",
    children: TemplateASTNode[],
}

export type EachNode = {
    type: "control-flow"
    kind: "each",
    iteratable: string,
    children: TemplateASTNode[]
    as?: string,
    key?: string
}
export type ControlFlowNode = IfNode | EachNode | ElseNode

export type Element = {
    type: "element",
    tag: string,
    isSelfClosing: boolean,
    children: TemplateASTNode[],
    attributes: Attribute[]
}

export type TemplateASTNode = Element | ControlFlowNode | TextNode

// TS MAGIC
// claude wrote this
export type Fn<T> = () => T;
export type InferConstTuple<T> = T extends readonly [infer First, ...infer Rest]
    ? [First extends Fn<infer R> ? R : never, ...InferConstTuple<Rest>]
    : [];
