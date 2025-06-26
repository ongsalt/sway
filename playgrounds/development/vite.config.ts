import { defineConfig } from "vite";
import sway from "vite-plugin-sway";
import Inspect from "vite-plugin-inspect";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        tailwindcss(),
        sway({
            compiler: {
                // staticTemplateParsing: false
            }
        }),
        Inspect()
    ]
});
