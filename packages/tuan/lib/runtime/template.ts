/*
So we need to first parse everything in <script> (lang="ts")
script will be run AS IS (well, after ts transpiling)

then every {} exporession in html template

Components
- need to check out how svelte can have multiple root component
*/


const _parserNode: HTMLElement = document.createElement("div")
export function parseHtml(template: string) {
    _parserNode.innerHTML = template
    // TODO: multi root

    const elements: Element[] = []
    for (let index = _parserNode.children.length - 1; index >= 0; index--) {
        const element = _parserNode.removeChild(_parserNode.children[index]);
        elements.push(element);
    }
    return () => elements.map(it => it.cloneNode(true))
}

export function parse(template: string) {
    return parseHtml(template)
}

