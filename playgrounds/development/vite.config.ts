import { defineConfig } from "vite"
import tuan from "vite-plugin-tuan"
import Inspect from "vite-plugin-inspect"

export default defineConfig({
    plugins: [
        tuan(),
        Inspect()
    ]
})