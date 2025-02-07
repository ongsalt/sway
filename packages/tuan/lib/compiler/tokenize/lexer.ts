import type { ControlFlowToken, SymbolTokenType, Token } from "./token"

export type LexerOptions = {

}


const defualtDelimiters = ["<", "{"]
export class Lexer {
    private hasError = false
    tokens: Token[] = []

    private escapeNext = false;
    private isInsideTag = false;
    private isScript = false; // we shuold use this flag for interpolation too
    private quoteState: "single" | "double" | "outside" = "outside";
    private textState: "before" | "text"  = "before"
    // We need to modify last text

    private start = 0
    private current = 0
    private line = 1

    constructor(private source: string, public readonly options: Partial<LexerOptions> = {}) { }

    scan() {
        while (!this.isAtEnd()) {
            this.start = this.current
            const c = this.next()

            if (this.escapeNext) {
                this.escapeNext = false
                // TODO: treat as normal
            }

            // For everything that is not sepearated by 
            switch (c) {
                case '{': {
                    if (!this.isScript) {
                        this.dynamic();
                        break;
                    }
                }
                case '\\': {
                    this.escapeNext = true
                    break;
                };
                case '=': this.symbolToken("equal"); break;
                case '>': {
                    this.isInsideTag = false
                    this.symbolToken("tag-close");
                    break;
                }

                case '<': {
                    if (this.match('!--')) {
                        // wait we parse this????
                        this.symbolToken("comment-start");
                    } else if (this.match('/')) {
                        // const lastTag = this.tokens.at(-1);
                        // if (lastTag?.type === "text") {
                        //     // console.log(lastTag)
                        //     lastTag.body = lastTag.body.trimEnd()
                        //     if (lastTag.body === "") {
                        //         // this.tokens.pop()
                        //     }
                        // }

                        this.isInsideTag = true;
                        this.symbolToken("tag-open-2");
                        this.next()
                        this.literal()
                    } else {
                        this.isInsideTag = true;
                        this.symbolToken("tag-open");
                        this.next()
                        if (this.literal() === "script") {
                            this.isScript = true;
                        }
                    }
                    break;
                }

                case '/': {
                    if (this.match('>')) {
                        this.isInsideTag = false
                        this.symbolToken("tag-close-2");
                        this.textState = "before"
                        break;
                    }
                }

                case ' ':
                case '\r':
                case '\t':
                    if (this.quoteState === "outside") {
                        // Ignore whitespace. for now, 
                        // HTML is dogshit
                        // TODO:
                    } else {
                        // console.log('space', this.current, this.quoteState, this.isInsideTag)
                        this.default()
                    }
                    break;
                case '\n':
                    this.line++;
                    break;
                case '"':
                    if (this.isInsideTag) {
                        if (this.quoteState === "single") {
                            // ignore
                            // TODO: is this branch realy possible
                        } else {
                            // console.log('"', this.current)
                            if (this.quoteState === "outside") {
                                this.quoteState = "double"
                            } else {
                                this.quoteState = "outside"
                            }
                            this.symbolToken('double-quote');
                            break;
                        }
                    }
                case "'":
                    if (this.isInsideTag) {
                        if (this.quoteState === "double") {
                            // ignore
                        } else {
                            if (this.quoteState === "outside") {
                                this.quoteState = "single"
                            } else {
                                this.quoteState = "single"
                            }
                            this.symbolToken('single-quote');
                            break;
                        }
                    }

                default:
                    this.default()
            }

        }

        this.tokens.push({
            type: "eof",
            line: this.line,
        })

        return this.tokens
    }

    private default() {
        // console.log('default', this.current, this.quoteState, this.isInsideTag)
        if (this.isInsideTag) {
            if (this.quoteState === "outside") {
                this.literal()
            } else {
                const delimiter = this.quoteState === "double" ? '"' : "'"
                const a = this.text([delimiter, ...defualtDelimiters], false)
            }
        } else {
            if (this.isScript) {
                // script escaping magic
                // we dont allow space in the tag
                this.text(["</script"])
                this.isScript = false
            } else {
                this.text(defualtDelimiters, false)
                this.textState = "text"
            }
        }
    }


    private literal() {
        const start = this.current - 1
        const isValidChar = (c: string) => /[a-zA-Z0-9'-]/.test(c);

        while (isValidChar(this.peek())) {
            this.current += 1;
        }

        const body = this.source.substring(start, this.current).trim();
        this.tokens.push({
            type: 'literal',
            body,
            line: this.line
        })

        return body;
    }

    private match(expected: string, consume = true) {
        if (this.isAtEnd()) {
            return false
        }

        let cursor = this.current;
        for (const c of expected) {
            if (this.source.at(cursor) !== c) {
                return false
            }
            cursor += 1;
        }

        // Consume it
        if (consume) {
            this.current = cursor;
        }
        return true
    }


    private next() {
        return this.source[this.current++] // consume
    }

    // Not gonna consume
    private peek() {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private symbolToken(type: SymbolTokenType) {
        this.tokens.push({
            type,
            line: this.line
        })
    }

    private text(delimiters = defualtDelimiters, trim = true) {
        // TODO: handle escaped char
        const matchSome = () => delimiters.some(it => this.match(it, false))
        while (!matchSome() && !this.isAtEnd()) {
            if (this.peek() == '\n') this.line++;
            const c = this.next();
            // console.log(c);
        }


        // console.log(this.peek())
        // if (this.isAtEnd()) {
        //     throw new Error(`Unterminated text at line:${this.line} (delimiter: ${delimiters})`)
        // }

        let body = this.source.substring(this.start, this.current);
        if (trim) {
            body = body.trim()
        } else {
            // TODO: think about this
            if (this.textState === "before") {
                // console.log({ body })
                body = body.trimStart()
            }
        }

        
        this.tokens.push({
            type: "text",
            body,
            line: this.line
        });

        return body
    }

    private dynamic() {
        // TODO: handle escaped char
        let count = 0; // count of '{'
        while (this.peek() != '}' && !this.isAtEnd() && count === 0) {
            if (this.peek() == '\n') this.line++;
            if (this.peek() == '{') count++;
            if (this.peek() == '}') count--;
            this.next();
        }

        if (this.isAtEnd()) {
            throw new Error("Unterminated string")
        }

        // consume the closing }
        this.next();

        // Trim the surrounding quotes
        const body = this.source.substring(this.start + 1, this.current - 1).trim();
        const isSpecialMarkUp = body.startsWith('#') || body.startsWith('/') || body.startsWith(':');

        if (!isSpecialMarkUp) {
            this.tokens.push({
                type: "interpolation",
                body,
                line: this.line
            });
        } else {
            const token = this.parseControlFlow(body)
            this.tokens.push({
                ...token,
                line: this.line
            });
        }
    }

    private parseControlFlow(trimmed: string): ControlFlowToken {
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
        } else if (trimmed.startsWith(':else')) {
            return {
                type: "else",
            }
        } else if (trimmed.startsWith("/if")) {
            return {
                type: "endif"
            }
        } else if (trimmed.startsWith("#each")) {
            // #each $collection as $item, $index ($key)
            // $item can be variable name or destructuring
            // we could parse this with acorn at later stage
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
                let lastWord = words.at(-1)
                let key: string | undefined = undefined
                if (lastWord?.startsWith("(") && lastWord.endsWith(")")) {
                    key = lastWord.slice(1, -1)
                }

                let as = ""
                if (key) {
                    as = words.slice(3, -1).join('')
                } else {
                    as = words.slice(3).join('')
                }

                return {
                    type: "each",
                    iteratable: words[1],
                    as,
                    key
                }
            }
            throw new Error("Invalid each syntax")
        } else if (trimmed.startsWith("/each")) {
            return {
                type: "endeach"
            }
        }

        throw new Error("Invalid each syntax")
    }

    isAtEnd() {
        return this.current >= this.source.length
    }

}
