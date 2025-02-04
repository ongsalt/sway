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

export function tokenize(template: string): Token[] {
    let current = 0

    const peak = () => template[current];
    const advance = () => current += 1;


    return []
}

export type Token = {

}

export type SymbolToken = {
    type: "<" | ">" | "</" | '"' | "'" | "{" | "}"
}

// for tagname, property key, property value 
export type LiteralToken = {
    type: "literal",
    value: string
}
