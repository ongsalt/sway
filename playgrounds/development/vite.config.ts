import { defineConfig } from "vite"
import sway from "vite-plugin-sway"
import Inspect from "vite-plugin-inspect"

export default defineConfig({
    plugins: [
        sway(),
        Inspect()
    ]
})