import type { Plugin } from "vite"
import { compile, CompilerOptions } from "tuan/compiler" 

// TODO: fix peer dependency later 

const fileRegex = /\.(tuan)$/

type Options = {
    compiler?: Partial<CompilerOptions>
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
        transform(src: string, id: string) {
            if (fileRegex.test(id)) {
                const code = compile(src, options.compiler ?? {})
                return {
                    code,
                    // map: null, // TODO: Rich harris' MagicString
                }
            }
        }
    }
}