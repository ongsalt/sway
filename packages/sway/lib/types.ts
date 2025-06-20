export type ComponentContext<Props extends Record<string, any> = Record<string, any>> = {
    $$anchor: Node;
    $$props: Props,
    $$slots: Record<string, RenderFn>,
};

export type RenderFn = ($$anchor: Node) => void;

export type Component = (context: ComponentContext) => unknown;

export type TagName = keyof HTMLElementTagNameMap | "text";
export type NodeCount = Partial<Record<TagName, number>>;
