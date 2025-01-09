import type { Plugin } from "vite"
import { sep } from "node:path"
import { compile, CompilerOptions } from "tuan/compiler"

// TODO: fix peer dependency later 

const fileRegex = /\.(tuan)$/

type Options = {
    compiler?: Partial<CompilerOptions>
}

function getFileName(path: string) {
    const name = path.split('/').at(-1)!.split('.')[0]
    return name
}

export default function tuan(options: Options = {}): Plugin {
    return {
        name: 'tuan-transformer',
        resolveId(source, importer, options) {
            if (fileRegex.test(source)) {
                return {
                    id: source,
                }
            }
        },
        shouldTransformCachedModule({ id }) {
            if (fileRegex.test(id)) {
                return true
            }
        },
        transform(src: string, id: string) {
            if (fileRegex.test(id)) {
                const code = compile(src, {
                    name: getFileName(id),
                    ...options.compiler
                })
                return {
                    code,
                    // map: null, // TODO: Rich harris' MagicString
                }
            }
        }
    }
}