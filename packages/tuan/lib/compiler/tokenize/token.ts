const symbolTokens = [
    "tag-open", // <
    "tag-open-2", // </
    "tag-close", // >
    "tag-close-2", // />
    "space", // TODO: think about how to handle space
    "equal",
    "comment-start",
    "comment-end",
    "eof",
] as const

export type SymbolTokenType = (typeof symbolTokens)[number]
export type SymbolToken = {
    type: SymbolTokenType
}

export type ControlFlowToken = {
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
} | {
    type: "else" | "endif" | "endeach",
}

export type InterpolationToken = {
    type: "interpolation",
    body: string
}

export type DynamicToken = InterpolationToken | ControlFlowToken

export type TextNodeToken = {
    type: "text",
    body: string
}

export type QuotedToken = {
    type: "quoted",
    body: string
}

export type LiteralToken = {
    type: "literal",
    body: string
}

export type WithLineNumber<T> = T & { line: number }

export type Token = WithLineNumber<TextNodeToken | DynamicToken | QuotedToken | SymbolToken | LiteralToken>