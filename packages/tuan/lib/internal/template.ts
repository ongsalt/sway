/*
So we need to first parse everything in <script> (lang="ts")
script will be run AS IS (well, after ts transpiling)

then every {} exporession in html template

Components
- need to check out how svelte can have multiple root component
*/

import { Component } from "../types"

const _parserNode = document.createElement("div")
export function parseHtml(content: string) {
    _parserNode.innerHTML = content
    // TODO: multi root

    const element = _parserNode.removeChild(_parserNode.children[0])
    return () => element.cloneNode(true)
}

export function parse(content: string) {
    return clientParse(content)
}

export function clientParse(content: string): Component {
    const root = parseHtml(content)

    return ({ }) => {

        root()
    }

}
