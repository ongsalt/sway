import { defineConfig } from "tsup"

export default defineConfig({
    entry: [
        'lib/index.ts',
        'lib/runtime/index.ts',
        'lib/compiler/index.ts',
    ],
    format: ["cjs", "esm"],
    // experimentalDts: true,
    dts: true,
    tsconfig: "tsconfig.json",
    shims: true,
})