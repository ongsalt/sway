import { defineConfig } from "vite";
import sway from "vite-plugin-sway";
import Inspect from "vite-plugin-inspect";

export default defineConfig({
    plugins: [
        sway({
            compiler: {
                staticTemplateParsing: false
            }
        }),
        Inspect()
    ]
});
