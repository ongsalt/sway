/*
html
Element -> OpenTag[T] Body CloseTag[T]
OpenTag[T] -> <{T} {Attr*} >
Attr = StaticAttr | DynamicAttr
StaticAttr -> {Identifier}="{any}"
DynamicAttr -> {Identifier}={any}
Identifier is alphabet + number + symbol - {'/', '<', '>'}
Body -> (Element | Text)*
CloseTag[T] -> </{T}>
Text -> anything else
Interpolation -> \{TEXT\}
Comment -> 

ok this one is better -> https://cs.lmu.edu/~ray/notes/xmlgrammar/
subset to implement:
- element
- attribute
- comment (ignore)
- text nodes (this is fucked up)
    - ignore whitespaces before and after body EXCEPT ???
    - svelte also has some non standard way of doing this 
*/

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

// TODO: think of better name
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

export type TokenWithoutLineNumber = TextNodeToken | DynamicToken | QuotedToken | SymbolToken | LiteralToken
export type Token = WithLineNumber<TokenWithoutLineNumber>