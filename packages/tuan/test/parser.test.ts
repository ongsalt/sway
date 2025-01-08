import { expect, it, test } from "vitest"
import { parseInterpolation } from "../lib/compiler/parser"

test("interpolation parsing", () => {
    expect(parseInterpolation("whatever {a} djdfhuj {b.method({ c: 12 })}"))
        .toStrictEqual([
            {
                type: "text",
                body: "whatever "
            },
            {
                type: "interpolation",
                body: "a"
            },
            {
                type: "text",
                body: " djdfhuj "
            },
            {
                type: "interpolation",
                body: "b.method({ c: 12 })"
            }
        ])
})