import { minify } from "html-minifier"

export function minifyHtml(html: string): string {
    return minify(html, {

    })
}