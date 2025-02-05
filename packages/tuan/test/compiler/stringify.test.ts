import { it } from "vitest";
import { parse } from "../../lib/compiler/parse";
import { tokenize } from "../../lib/compiler/tokenize";
import { ifElseInput } from "./testcases";
import { stringify } from "../../lib/compiler/transform/html";

it('shuold stringify', () => {
    const tokens = tokenize(ifElseInput)
    // console.log(tokens)

    const nodes = parse(tokens)

    // exclude script 
    const out = nodes.slice(1).map(stringify).join('')

    console.log(out)
})