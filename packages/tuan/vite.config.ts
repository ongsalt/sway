import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [
        dts({
            // rollupTypes: true,
            tsconfigPath: "tsconfig.lib.json",
        })
    ],
    build: {
        lib: {
            entry: [
                resolve(__dirname, 'lib/index.ts'),
                resolve(__dirname, 'lib/runtime.ts')
            ],
            formats: ["es"],
            // name: 'Tuan',
            // the proper extensions will be added
            fileName: (format, entryName) => `${entryName}.js`,
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            // external: ['vue'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    // vue: 'Vue',
                },
            },
        },
    },
})