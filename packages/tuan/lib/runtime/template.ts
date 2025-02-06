
// TODO: whitespace handling
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace 

export function template(html: string) {
    return parse(html)
}

export function parse(html: string): () => DocumentFragment {
    const template: HTMLTemplateElement = document.createElement("template")
    template.innerHTML = html

    return () => template.content.cloneNode(true) as DocumentFragment
}
