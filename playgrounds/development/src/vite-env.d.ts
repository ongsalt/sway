/// <reference types="vite/client" />


// TODO: make a tsconfig
declare module '*.tuan' {
    import type { Component } from "tuan"
    declare const component: Component
    export default component
}