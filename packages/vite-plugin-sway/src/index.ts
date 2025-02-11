import { compile, CompilerOptions } from "sway/compiler"
import type { Plugin } from "vite"

// TODO: fix peer dependency later 

const fileRegex = /\.(sway)$/

type SwayOptions = {
    compiler?: Partial<CompilerOptions>
}

function getFileName(path: string) {
    const name = path.split('/').at(-1)!.split('.')[0]
    return name
}

export default function sway(options: SwayOptions = {}): Plugin {
    return {
        name: 'sway-transformer',
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
                const { output } = compile(src, {
                    name: getFileName(id),
                    ...options.compiler
                })
                return {
                    code: output,
                    // map: null, // TODO: Rich harris' MagicString
                }
            }
        }
    }
}