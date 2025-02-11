import { compile } from 'sway/compiler'


const src = await Bun.file('./src/components/each.sway').text()
const result = compile(src, {})
// console.dir(result.ast, { depth: null })
console.log(result.output)
