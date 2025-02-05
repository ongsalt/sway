import { Component } from "../types";
import { comment } from "./internal";

export function mount(component: Component, root: HTMLElement) {
    const anchor = comment()
    root.appendChild(anchor)
    component({ anchor })
}

export function unmount() {

}