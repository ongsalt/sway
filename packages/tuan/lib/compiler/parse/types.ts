// I LOVE TAGGED UNION

export type Attribute = {
    key: string,
    value: string,
} & (
        {
            dynamic: true,
            isFunction: boolean,
        } | {
            dynamic: false
        }
    )

export type TextNode = {
    // type: "text",
    texts: {
        type: "static" | "interpolation"
        body: string
    }[]
}

// we gonna make if/else block behave like a node
export type IfNode = {
    type: "if",
    condition: string
    children: Node[],
    elseChildren: Node[]
}

export type EachNode = {
    type: "each",
    iteratable: string,
    children: Node[]
    as?: string,
    key?: string
}
export type ControlFlowNode = IfNode | EachNode

export type Node = {
    type: "text",
    text: TextNode,
} | {
    type: "element",
    element: Element
} | {
    type: "control-flow",
    control: ControlFlowNode
}

export type Element = {
    tag: string,
    children: Node[],
    attributes: Attribute[]
}


// TS MAGIC
// claude wrote this
export type Fn<T> = () => T;
export type InferConstTuple<T> = T extends readonly [infer First, ...infer Rest]
    ? [First extends Fn<infer R> ? R : never, ...InferConstTuple<Rest>]
    : [];
