
// TODO: whitespace handling
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace 

const _parserNode: HTMLElement = document.createElement("div")
export function parseHtml(template: string) {
    _parserNode.innerHTML = template
    // TODO: multi root

    const elements: Element[] = []
    for (let index = _parserNode.children.length - 1; index >= 0; index--) {
        const element = _parserNode.removeChild(_parserNode.children[0]);
        elements.push(element);
    }
    return () => elements.map(it => it.cloneNode(true))
}

export function parse(template: string) {
    return parseHtml(template)
}

