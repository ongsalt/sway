import { compile } from 'tuan/compiler'


const src = await Bun.file('./src/components/interpolation.tuan').text()
const result = compile(src, {})
console.log(result)
