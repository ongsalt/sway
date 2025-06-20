import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        'lib/index.ts',
        'lib/runtime/index.ts',
        'lib/compiler/index.ts',
    ],
    format: ["cjs", "esm"],
    dts: true,
    tsconfig: "tsconfig.json",
    sourcemap: true,
    shims: true,
    clean: true
});
