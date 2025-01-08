type TextNode = {
    type: "text" | "interpolation"
    body: string // without {}
}

/**
 * input: `whatever {a} djdfhuj {b.method({ c: 12 })}` 
 * input: `whatever /{a} djdfhuj {b.method({ c: 12 })}` 
 */
export function parseInterpolation(code: string): TextNode[] {
    const out: TextNode[] = []
    let text = ""
    let count = 0
    let current = 0
    let isText = true
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
                isText = false
                text = ""
            }
        } else if (code[current] === "}" && !ignore) {
            count--
            if (count === 0) {
                current++
                out.push({
                    type: "interpolation",
                    body: text
                })
                isText = true
                text = ""
            }
        }
        text += code[current]
        ignore = false
        current += 1;
    }


    return out
}