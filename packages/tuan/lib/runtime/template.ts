
// TODO: whitespace handling
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace 

export function parse(template: string): () => DocumentFragment {
    const parserNode: HTMLTemplateElement = document.createElement("template")
    parserNode.innerHTML = template

    return () => parserNode.content.cloneNode(true) as DocumentFragment
}

