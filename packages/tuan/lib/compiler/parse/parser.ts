import { Token } from "../tokenize";
import { InterpolationToken, LiteralToken, QuotedToken, TextNodeToken, TokenWithoutLineNumber } from "../tokenize/token";
import { Attribute, ControlFlowElement, Node, TextNode, Element, Fn, InferConstTuple } from "./types";
import { ParserError } from "./error"

export class Parser {
    private current = 0
    constructor(public tokens: Token[]) { }

    private isAtEnd() {
        return this.current >= this.tokens.length;
    }

    private next() {
        return this.tokens[this.current++] // yield current and move the pointer to next one
    }

    private peek() {
        if (this.isAtEnd()) return undefined;
        return this.tokens.at(this.current)!;
    }

    get line() {
        return this.peek()?.line
    }

    private safe<T>(fn: () => T) { // auto rewinding
        const position = this.current
        // BRUH
        try {
            return {
                ok: true,
                value: fn()
            } as const
        } catch (error) {
            this.current = position
            return {
                ok: false,
                error
            } as const
        }
    }

    private consumeToken<T extends TokenWithoutLineNumber>(type: T["type"]): T { // TODO: im too lazy to make the type
        const token = this.peek()!

        if (token.type != type) {
            throw new ParserError("expected", `Expecting ${type} at line ${token.line}`) // TODO: make error enum
        }

        this.next()
        return token as unknown as T
    }

    private consumeAll<T>(consume: () => T): T[] {
        const results: T[] = []
        while (true) {
            const res = this.safe(() => consume())
            // console.log(`[consumeAll] consuming ${res.value}`)
            if (!res.ok) {
                // console.log(`[consumeAll] stoping ${res.ok}`)
                break
            }
            results.push(res.value)
        }

        return results
    }

    private oneOf<const T extends readonly Fn<any>[]>(fns: T): InferConstTuple<T>[number] {
        for (const fn of fns) {
            const res = this.safe(() => fn())
            if (res.ok) {
                return {
                    ok: true,
                    value: res.value
                } as const
            }
        }

        return {
            ok: false
        } as const
    }

    private oneOfOrThrow<
        const T extends readonly Fn<any>[],
        E extends Error = ParserError
    >(
        fns: T,
        errorBuilder: () => E = (() => new ParserError("expected", "not exist") as Error as E)
    ): InferConstTuple<T>[number] {
        const res = this.oneOf(fns)
        if (!res.ok) {
            throw errorBuilder()
        }

        return res.value
    }

    parse(): Node[] {
        return this.consumeAll(() => {
            const node = this.node()
            // console.log(node)
            return node
        })
    }

    private node(): Node {
        return this.oneOfOrThrow(
            [
                () => ({
                    type: "text" as const,
                    node: this.text()
                }),
                () => ({
                    type: "element" as const,
                    element: this.element()
                }),
                () => ({
                    type: "control-flow" as const,
                    control: this.controlFlow()
                }),
            ],
            () => new ParserError("invalid", "node")
        )
    }

    private element(): Element {
        const { attributes, tagName } = this.openingTag()
        const children = this.consumeAll(() => this.node())
        const closingTagName = this.closingTag()

        if (closingTagName != tagName) {
            throw new ParserError("invalid", `Tag:${tagName} doesn't match at line ${this.line}`)
        }

        return {
            tag: tagName,
            attributes,
            children,
        }
    }

    // TODO: handle void element - https://developer.mozilla.org/en-US/docs/Glossary/Void_element
    private openingTag() {
        this.consumeToken("tag-open")
        const res = this.tagBody()
        this.consumeToken("tag-close")
        return res
    }

    private closingTag() {
        this.consumeToken("tag-open-2")
        const { body } = this.consumeToken("literal") as LiteralToken
        this.consumeToken("tag-close")
        return body // tag name
    }

    private selfClosingTag() {
        this.consumeToken("tag-open")
        const res = this.tagBody()
        this.consumeToken("tag-close-2")
        return res
    }

    private tagBody() {
        const { body: tagName } = this.consumeToken<LiteralToken>("literal")

        // I dont want to think about `this` so arrow function it is then
        const attributes = this.consumeAll(() => this.attribute())

        return {
            tagName,
            attributes
        }
    }

    private attribute(): Attribute {
        const { body: key } = this.consumeToken<LiteralToken>("literal")
        this.consumeToken("equal")
        return this.oneOfOrThrow(
            [
                () => ({
                    key,
                    value: this.consumeToken<QuotedToken>("quoted").body,
                    dynamic: false as const
                }),
                () => ({
                    key,
                    value: this.consumeToken<InterpolationToken>("interpolation").body,
                    dynamic: true,
                    isFunction: key.startsWith("on") // or this is component & Might remove later
                })
            ],
            () => new ParserError("invalid", `Invalid attribute at line ${this.line}`)
        )
        // try {
        //     const { body: value } = this.consumeToken<QuotedToken>("quoted")
        //     return {
        //         key,
        //         value,
        //         dynamic: false
        //     }
        // } catch { }
        // try {
        //     const { body: value } = this.consumeToken<InterpolationToken>("interpolation")
        //     return {
        //         key,
        //         value,
        //         dynamic: true,
        //         isFunction: key.startsWith("on") // or this is component & Might remove later
        //     }
        // } catch { }
        // throw new ParserError("invalid", `Invalid attribute at line ${this.line}`)
    }

    private text(): TextNode {
        const texts = this.consumeAll(() => this.oneOfOrThrow(
            [
                () => this.consumeToken<TextNodeToken>("text"),
                () => this.consumeToken<InterpolationToken>("interpolation"),
            ],
        ))

        if (texts.length === 0) {
            throw new ParserError("stop-signal", "There is no text left")
        }

        return {
            type: "text",
            texts: texts.map(it => ({
                type: it.type === "text" ? "static" : "interpolation",
                body: it.body
            })),
        }
    }

    private controlFlow(): ControlFlowElement {
        throw new Error("Unimplemented")
    }
}