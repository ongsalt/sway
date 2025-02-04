import { expect, it, test } from "vitest"
import { parseInterpolation } from "../lib/compiler/parser"

test("interpolation parsing", () => {
    expect(parseInterpolation("whatever {a} djdfhuj {b.method({ c: 12 })} {d * 2}"))
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
            },
            {
                type: "text",
                body: " "
            },
            {
                type: "interpolation",
                body: "d * 2"
            }
        ])
})

test("css class", () => {
    const input = "rounded {active.value ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} p-2 px-4 text-white"
    const result = parseInterpolation(input)
    expect(result)
        .toStrictEqual([
            {
                type: "text",
                body: "rounded "
            },
            {
                type: "interpolation",
                body: "active.value ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'"
            },
            {
                type: "text",
                body: " p-2 px-4 text-white"
            },
        ])
})