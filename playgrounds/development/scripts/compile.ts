import { compile } from 'tuan/compiler'


const src = await Bun.file('./src/components/attributes.tuan').text()
const result = compile(src, {})
console.log(result)
