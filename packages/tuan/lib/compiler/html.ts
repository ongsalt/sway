import { minify } from "html-minifier"

export function minifyHtml(html: string): string {
    const minified = minify(html, { 
        collapseWhitespace: true
    })
    // TODO: escape this
    return minified
}