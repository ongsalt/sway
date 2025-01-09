import { defineConfig } from "tsup"

export default defineConfig({
    entry: [
        'lib/index.ts',
        'lib/runtime.ts',
        'lib/compiler/index.ts',
    ],
    format: ["cjs", "esm"],
    experimentalDts: true,
    tsconfig: "tsconfig.lib.json",
    shims: true,
})