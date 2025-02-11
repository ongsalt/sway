export type ComponentContext = {
    anchor: Node
}

export type Component = (context: ComponentContext) => unknown

export type TagName = keyof HTMLElementTagNameMap | "text"
export type NodeCount = Partial<Record<TagName, number>>
