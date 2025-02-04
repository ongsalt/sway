import { expect, it } from "vitest"
import { Lexer } from "../lib/compiler/tokenize/lexer"

const input = `<script>
    import { signal, computed, effect } from "tuan";

    const show = signal(true)
    const a = signal("skibidi")

    const toggle = () => { 
        show.value = !show.value
    } 
</script>

<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2">
    <h1 class="text-2xl"> If else test </h1>
    <p>{show.value}</p>
    {#if show.value}
        <h2> First content </h2>
        <p>
            We're <br/>
            No stranger to love 
        </p>
        <p>{a.value}</p>
    {:else}
        <h2> Second content </h2>
        <p> Multi root </p>
    {/if}
    <button onclick={toggle} class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white "> increment </button>
</main>`

const res = [
    { type: 'tag-open', line: 1 },
    { type: 'literal', body: 'script', line: 1 },
    { type: 'tag-close', line: 1 },
    {
        type: 'text',
        body: 'import { signal, computed, effect } from "tuan";\n' +
            '\n' +
            '    const show = signal(true)\n' +
            '    const a = signal("skibidi")\n' +
            '\n' +
            '    const toggle = () => { \n' +
            '        show.value = !show.value\n' +
            '    }',
        line: 10
    },
    { type: 'tag-open-2', line: 10 },
    { type: 'literal', body: 'script', line: 10 },
    { type: 'tag-close', line: 10 },
    { type: 'tag-open', line: 12 },
    { type: 'literal', body: 'main', line: 12 },
    { type: 'literal', body: 'class', line: 12 },
    { type: 'equal', line: 12 },
    {
        type: 'quoted',
        body: 'm-8 border rounded-lg shadow-sm p-6 space-y-2',
        line: 12
    },
    { type: 'tag-close', line: 12 },
    { type: 'tag-open', line: 13 },
    { type: 'literal', body: 'h1', line: 13 },
    { type: 'literal', body: 'class', line: 13 },
    { type: 'equal', line: 13 },
    { type: 'quoted', body: 'text-2xl', line: 13 },
    { type: 'tag-close', line: 13 },
    { type: 'text', body: 'If else test', line: 13 },
    { type: 'tag-open-2', line: 13 },
    { type: 'literal', body: 'h1', line: 13 },
    { type: 'tag-close', line: 13 },
    { type: 'tag-open', line: 14 },
    { type: 'literal', body: 'p', line: 14 },
    { type: 'tag-close', line: 14 },
    { type: 'interpolation', body: 'show.value', line: 14 },
    { type: 'tag-open-2', line: 14 },
    { type: 'literal', body: 'p', line: 14 },
    { type: 'tag-close', line: 14 },
    { type: 'if', condition: 'show.value', line: 15 },
    { type: 'tag-open', line: 16 },
    { type: 'literal', body: 'h2', line: 16 },
    { type: 'tag-close', line: 16 },
    { type: 'text', body: 'First content', line: 16 },
    { type: 'tag-open-2', line: 16 },
    { type: 'literal', body: 'h2', line: 16 },
    { type: 'tag-close', line: 16 },
    { type: 'tag-open', line: 17 },
    { type: 'literal', body: 'p', line: 17 },
    { type: 'tag-close', line: 17 },
    { type: 'text', body: "We're", line: 18 },
    { type: 'tag-open', line: 18 },
    { type: 'literal', body: 'br', line: 18 },
    { type: 'literal', body: '/', line: 18 },
    { type: 'tag-close', line: 18 },
    { type: 'text', body: 'No stranger to love', line: 20 },
    { type: 'tag-open-2', line: 20 },
    { type: 'literal', body: 'p', line: 20 },
    { type: 'tag-close', line: 20 },
    { type: 'tag-open', line: 21 },
    { type: 'literal', body: 'p', line: 21 },
    { type: 'tag-close', line: 21 },
    { type: 'interpolation', body: 'a.value', line: 21 },
    { type: 'tag-open-2', line: 21 },
    { type: 'literal', body: 'p', line: 21 },
    { type: 'tag-close', line: 21 },
    { type: 'else', line: 22 },
    { type: 'tag-open', line: 23 },
    { type: 'literal', body: 'h2', line: 23 },
    { type: 'tag-close', line: 23 },
    { type: 'text', body: 'Second content', line: 23 },
    { type: 'tag-open-2', line: 23 },
    { type: 'literal', body: 'h2', line: 23 },
    { type: 'tag-close', line: 23 },
    { type: 'tag-open', line: 24 },
    { type: 'literal', body: 'p', line: 24 },
    { type: 'tag-close', line: 24 },
    { type: 'text', body: 'Multi root', line: 24 },
    { type: 'tag-open-2', line: 24 },
    { type: 'literal', body: 'p', line: 24 },
    { type: 'tag-close', line: 24 },
    { type: 'endif', line: 25 },
    { type: 'tag-open', line: 26 },
    { type: 'literal', body: 'button', line: 26 },
    { type: 'literal', body: 'onclick', line: 26 },
    { type: 'equal', line: 26 },
    { type: 'interpolation', body: 'toggle', line: 26 },
    { type: 'literal', body: 'class', line: 26 },
    { type: 'equal', line: 26 },
    {
        type: 'quoted',
        body: 'rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white ',
        line: 26
    },
    { type: 'tag-close', line: 26 },
    { type: 'text', body: 'increment', line: 26 },
    { type: 'tag-open-2', line: 26 },
    { type: 'literal', body: 'button', line: 26 },
    { type: 'tag-close', line: 26 },
    { type: 'tag-open-2', line: 27 },
    { type: 'literal', body: 'main', line: 27 },
    { type: 'tag-close', line: 27 },
    { type: 'eof', line: 27 }
]

it('should parse this thing', () => {
    const lexer = new Lexer(input)
    lexer.scan()
    console.log(lexer.tokens)
    expect(lexer.tokens).toStrictEqual(res)
})