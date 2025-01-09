import { Component } from "./types";

export function mount(component: Component, root: HTMLElement) {
    root.innerHTML = ""
    component({ anchor: root })
}

export function unmount() {

}