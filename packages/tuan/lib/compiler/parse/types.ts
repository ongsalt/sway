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
    type: "text",
    texts: {
        type: "static" | "interpolation"
        body: string
    }[]
}

// we gonna make if/else block behave like a node
export type ControlFlowElement = {
    type: "if" | "elif",
    condition: string
} | {
    type: "each",
    iteratable: string,
    as?: {
        name: string,
        index?: string,
        key?: string
    }
}

export type Node = {
    type: "text",
    node: TextNode,
} | {
    type: "element",
    element: Element
} | {
    type: "control-flow",
    control: ControlFlowElement
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
