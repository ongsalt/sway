// I LOVE TAGGED UNION

export type Attribute = {
    key: string,
} & (
        {
            whole: true, // for key={}
            isBinding: boolean,
            expression: string;
        } | {
            whole: false, // for key="something-{}"
            texts: TextOrInterpolation[];
        }
    );

export type TextOrInterpolation = {
    type: "static" | "interpolation";
    body: string;
};

export type TextNode = {
    type: "text",
    parent?: Parent;
    texts: TextOrInterpolation[];
};

// we gonna make if/else block behave like a node
export type IfNode = {
    type: "control-flow";
    parent?: Parent;
    kind: "if",
    condition: string;
    children: TemplateASTNode[],
    else?: ElseNode;
};

// just for the transformer
export type ElseNode = {
    type: "control-flow";
    parent?: IfNode;
    kind: "else",
    children: TemplateASTNode[],
};

export type EachNode = {
    type: "control-flow";
    parent?: Parent;
    kind: "each",
    iteratable: string,
    children: TemplateASTNode[];
    index?: string,
    as?: string,
    key?: string;
};

export type ControlFlowNode = IfNode | EachNode | ElseNode;

export type ElementNode = {
    type: "element",
    parent?: Parent;
    tag: string,
    isSelfClosing: boolean,
    children: TemplateASTNode[],
    attributes: Attribute[];
};

export type ComponentNode = {
    type: "component",
    parent?: Parent;
    name: string,
    isSelfClosing: boolean,
    children: TemplateASTNode[],
    props: Attribute[];
};

export type TemplateASTNode = ComponentNode | ElementNode | ControlFlowNode | TextNode;
export type TemplateASTNodeWithRoot = ComponentNode | ElementNode | ControlFlowNode | TextNode | TemplateAST;
export type Parent = ElementNode | ControlFlowNode | TemplateAST | ComponentNode;

export type TemplateAST = {
    type: "root";
    script?: ElementNode;
    children: TemplateASTNode[];
    style?: ElementNode;
};

// TS MAGIC
// claude wrote this
export type Fn<T> = () => T;
export type InferConstTuple<T> = T extends readonly [infer First, ...infer Rest]
    ? [First extends Fn<infer R> ? R : never, ...InferConstTuple<Rest>]
    : [];
