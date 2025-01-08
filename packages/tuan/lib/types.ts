export type ComponentContext = {

}

export type Component = (context: ComponentContext) => unknown

type TagName = keyof HTMLElementTagNameMap | "text"
export type NodeCount = Partial<Record<TagName, number>>