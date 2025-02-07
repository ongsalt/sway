import { Token } from "../tokenize";
import { EachToken, IfOrElifToken, InterpolationToken, LiteralToken, SymbolToken, TextNodeToken, TokenWithoutLineNumber } from "../tokenize/token";
import { Result } from "../utils";
import { TemplateASTNode, Attribute, ControlFlowNode, EachNode, Element, Fn, IfNode, InferConstTuple, TextNode } from "./ast";
import { ParserError } from "./error";

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

    private safe<T>(fn: () => T): Result<T> { // auto unwinding
        const position = this.current
        // BRUH
        try {
            return {
                ok: true,
                value: fn()
            }
        } catch (error) {
            if (!(error instanceof ParserError)) {
                throw error;
            }
            // console.log('[unwinding] ',error)
            this.current = position
            return {
                ok: false,
                error: error as any
            }
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
            // console.log({
            //     res: res.value,
            //     current: this.peek()
            // })
            // console.log(`[consumeAll] consuming ${res.value}`)
            if (!res.ok) {
                // console.log(`[consumeAll] stoping ${res.ok}`)
                break
            }
            results.push(res.value)
        }

        return results
    }

    private oneOf<const T extends readonly Fn<any>[]>(fns: T): Result<InferConstTuple<T>[number]> {
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
            ok: false,
            error: undefined
        } as const
    }

    private oneOfOrThrow<
        const T extends readonly Fn<any>[],
        E extends Error = ParserError
    >(
        fns: T,
        errorBuilder: (e: any) => E = (() => new ParserError("expected", "not exist") as Error as E)
    ): InferConstTuple<T>[number] {
        const res = this.oneOf(fns)
        if (!res.ok) {
            throw errorBuilder(res.error)
        }

        return res.value
    }

    parse(): TemplateASTNode[] {
        return this.nodes()
    }

    private nodes(): TemplateASTNode[] {
        return this.consumeAll(() => this.node())
    }

    private node(): TemplateASTNode {
        return this.oneOfOrThrow(
            [
                () => this.text(),
                () => this.element(),
                () => this.controlFlow(),
            ],
            () => new ParserError("invalid", "node")
        )
    }

    private element(): Element {
        return this.oneOfOrThrow([
            () => this.normalElement(),
            () => this.selfClosingElement()
        ])
    }

    private normalElement(): Element {
        const { attributes, tagName } = this.openingTag()
        const children = this.consumeAll(() => this.node())
        const closingTagName = this.closingTag()

        if (closingTagName != tagName) {
            throw new ParserError("invalid", `Tag:${tagName} doesn't match at line ${this.line}`)
        }

        return {
            type: "element",
            tag: tagName,
            isSelfClosing: false,
            attributes,
            children,
        }
    }

    private selfClosingElement(): Element {
        const { attributes, tagName } = this.selfClosingTag()
        return {
            type: "element",
            tag: tagName,
            isSelfClosing: true,
            attributes,
            children: [],
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
        // console.log(`Self closing tag: ${res.tagName}`)
        // console.log(this.peek())
        this.consumeToken("tag-close-2")
        // console.log(`Self closing tag: ${res.tagName}`)
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
        return this.oneOfOrThrow(
            [
                () => this.wholeAttribute(),
                () => this.normalAttribute()
            ],
        )
    }

    private wholeAttribute(): Attribute {
        const { body: key } = this.consumeToken<LiteralToken>("literal")
        this.consumeToken("equal")
        const { body: expression } = this.consumeToken<InterpolationToken>("interpolation")


        return {
            key,
            whole: true,
            expression,
        }
    }

    private normalAttribute(): Attribute {
        const { body: key } = this.consumeToken<LiteralToken>("literal")
        this.consumeToken("equal")
        const texts = this.oneOfOrThrow([
            () => {
                this.consumeToken<SymbolToken>("single-quote")
                const texts = this.consumeAll(() => this.oneOfOrThrow([
                    () => this.consumeToken<InterpolationToken>("interpolation"),
                    () => this.consumeToken<TextNodeToken>("text"),
                ]))
                this.consumeToken<SymbolToken>("single-quote")
                return texts
            },
            () => {
                this.consumeToken<SymbolToken>("double-quote")
                const texts = this.consumeAll(() => this.oneOfOrThrow([
                    () => this.consumeToken<InterpolationToken>("interpolation"),
                    () => this.consumeToken<TextNodeToken>("text"),
                ]))
                this.consumeToken<SymbolToken>("double-quote")
                return texts
            }
        ])

        return {
            key,
            whole: false,
            texts: texts.map(it => ({
                type: it.type === "text" ? "static" : "interpolation",
                body: it.body
            }))
        }
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

    private controlFlow(): ControlFlowNode {
        return this.oneOfOrThrow([
            () => this.ifNode(),
            () => this.eachNode(),
        ])
    }

    private ifNode(): IfNode {
        const { condition } = this.consumeToken<IfOrElifToken>("if")
        // Should we allow empty if body
        const children = this.nodes()

        let elseChildren: TemplateASTNode[] = []

        const elifChildren = this.safe(() => this.elifNode())

        if (elifChildren.ok) {
            elseChildren.push(elifChildren.value)
        } else {
            const res = this.safe(() => {
                this.consumeToken("else")
                return this.nodes()
            })

            if (res.ok) {
                elseChildren = res.value
            }
        }

        // console.dir(children, { depth: null })
        this.consumeToken("endif")

        return {
            type: "control-flow",
            kind: "if",
            condition,
            children,
            else: {
                type: "control-flow",
                kind: "else",
                children: elseChildren,
            }
        }
    }

    private elifNode(): IfNode {
        const { condition } = this.consumeToken<IfOrElifToken>("elif")
        const children = this.nodes()

        const elseChildren: Result<TemplateASTNode[]> = this.oneOf([
            () => [this.elifNode()],
            () => {
                this.consumeToken("else")
                return this.nodes()
            }
        ])
        // console.log("elseChildren")

        
        const ifNode: IfNode = {
            type: "control-flow",
            kind: "if",
            condition,
            children,
        }

        if (elseChildren.ok && elseChildren.value.length !== 0) {
            ifNode.else = {
                type: "control-flow",
                kind: "else",
                children: elseChildren.value,
            }
        }

        return ifNode;
    }

    private eachNode(): EachNode {
        const { iteratable, as = undefined, key = undefined } = this.consumeToken<EachToken>("each")
        // Should we allow empty if body
        const children = this.nodes()
        this.consumeToken("endeach")

        let asName = as
        let index = as?.split(',').at(-1)?.trim()
        if (index) {
            asName = as?.split(',').slice(0, -1).join('')
            // FUCK
            // i forget that everything under {} is js expression 
            // TODO: count { to know when interpolation is stopped
            // TODO: check if index is valid variable name
        }

        return {
            type: "control-flow",
            kind: "each",
            iteratable,
            as: asName,
            index,
            key,
            children
        }
    }
}
