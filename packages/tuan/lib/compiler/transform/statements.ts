import { Node } from "estree"

export type EstreeNode = {
    type: "estree",
    node: Node
}

export type AnyStatement = {
    type: "any",
    body: string
}

export type UserEffectStatement = {
    type: "user-effect",
    body: string
}

export type UserScriptStatement = {
    type: "user-script",
    body: string
}

export type AttributeUpdatingStatement = {
    type: "attribute-updating",
    target: string,
    key: string, // textContent, class, ...
    isFunction: false, // onclick
    valueExpression: string,
}

export type TextSettingStatement = {
    type: "text-setting",
    accessor: string,
    valueExpression: string
}

export type TemplateFragmentStatement = {
    type: "template-fragment",
    body: TuanStatement[]
}

export type TemplateEffectStatement = {
    type: "template-effect",
    body: (AttributeUpdatingStatement | TextSettingStatement)[]
}

export type TemplateIfStatement = {
    type: "if",
    // why do svelte pass anchor around tho
    body: TuanStatement[]
}

// TODO: think about 2way binding in each
export type TemplateEachStatement = {
    type: "each",
    iteratable: string,
    as?: string,
    key?: string
    body: TuanStatement[]
}

export type TemplateRootStatement = {
    type: "template-root",
    template: string
}

export type AccessorDefinitionStatement = {
    type: "accessor-definition"
    tag: string,
    path: number[], // ???
    anchor: string
}

export type ComponentDeclarationStatement = {
    type: "component-declaration",
    name: string,
    body:  TuanStatement[]
}

export type TuanStatement = TemplateEffectStatement | AccessorDefinitionStatement | TemplateEachStatement | TemplateIfStatement | TemplateRootStatement
    | TemplateFragmentStatement | UserEffectStatement | TextSettingStatement | AttributeUpdatingStatement
    | EstreeNode | AnyStatement | ComponentDeclarationStatement | UserScriptStatement
