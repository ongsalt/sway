/// <reference types="vite/client" />


// TODO: make a tsconfig
declare module '*.sway' {
    import type { Component } from "sway"
    declare const component: Component
    export default component
}