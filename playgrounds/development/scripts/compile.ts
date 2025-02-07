import { compile } from 'tuan/compiler'


const src = await Bun.file('./src/components/each.tuan').text()
const result = compile(src, {})
// console.dir(result.ast, { depth: null })
console.log(result.output)
