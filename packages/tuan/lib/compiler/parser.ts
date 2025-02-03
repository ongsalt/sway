export type TuanTextNode = {
    type: "text" | "interpolation"
    body: string // without {}
}

/**
 * input: `whatever {a} djdfhuj {b.method({ c: 12 })}` 
 * input: `whatever /{a} djdfhuj {b.method({ c: 12 })}` 
 */
export function parseInterpolation(code: string): TuanTextNode[] {
    const out: TuanTextNode[] = []
    let text = ""
    let count = 0
    let current = 0
    let ignore = false

    while (current < code.length) {
        if (code[current] === "\\") {
            ignore = true
        } else if (code[current] === "{" && !ignore) {
            count++
            if (count === 1) {
                current++
                out.push({
                    type: "text",
                    body: text
                })
                text = ""
            }
        } else if (code[current] === "}" && !ignore) {
            count--
            if (count === 0) {
                current++
                // TODO: verify that `text` is an expression using acorn
                out.push({
                    type: "interpolation",
                    body: text
                })
                text = ""
            }
        }
        if (current >= code.length) {
            break
        }
        text += code[current]
        ignore = false
        current += 1;
    }

    if (count !== 0) {
        // TODO: provide more useful information
        throw new Error("Mismatched parentheses");
    }

    if (text.length !== 0) {
        out.push({
            type: "text",
            body: text
        })
    }

    return out
}

export function parse(template: string) {
    const roots: HTMLNode[] = [];

    let current = 0;
}

type ParseSpecialMarkUpResult = {
    isSpecialMarkUp: false;
    node: undefined;
} | {
    isSpecialMarkUp: true;
    node: ControlFlowNode;
}

type ControlFlowNode = {
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

// I shuold write a custom parser for real
export function parseSpecialMarkUp(interpolation: string): ParseSpecialMarkUpResult {
    const trimmed = interpolation.trim();
    const isSpecialMarkUp = trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith(':');
    if (!isSpecialMarkUp) {
        return {
            isSpecialMarkUp
        }
    }

    const node = _parseSpecialMarkup(interpolation)

    return {
        isSpecialMarkUp: true,
        node
    }
}

function _parseSpecialMarkup(trimmed: string): ControlFlowNode {
    if (trimmed.startsWith('#if ')) {
        return {
            type: "if",
            condition: trimmed.substring(3).trimStart()
        }
    } else if (trimmed.startsWith(':else if ')) {
        return {
            type: "elif",
            condition: trimmed.substring(8).trimStart()
        }
    } else if (trimmed.startsWith(':else ')) {
        return {
            type: "else",
        }
    } else if (trimmed.startsWith("\if")) {
        return {
            type: "endif"
        }
    } else if (trimmed.startsWith("#each")) {
        const words = trimmed.split(' ').filter(it => it.length != 0)
        if (words.length < 2) {
            // TODO: better error handling
            throw new Error("Invalid each syntax")
        }
        if (words.length == 2) {
            return {
                type: "each",
                iteratable: words[1],
            }
        }
        if (words[2] != "as") {
            throw new Error("Invalid each syntax")
        }
        if (words.length >= 4) {
            // TODO: parse index and key
            return {
                type: "each",
                iteratable: words[1],
                as: {
                    name: words[3]
                }
            }
        }
        throw new Error("Invalid each syntax")
    } else if (trimmed.startsWith("\each")) {
        return {
            type: "endeach"
        }
    }

    throw new Error("Invalid each syntax")
}


export type HTMLNode = {
    type: "element",
    attributes: Record<string, TemplateAttribute>,
    tag: string,
    children: HTMLNode[]
} | HTMLTextNode

export type HTMLTextNode = {
    type: "text",
    value: string
}

export type TemplateAttribute = {
    type: "event-handler" | "text"
    // isBinding: boolean,
    value: string,
}
