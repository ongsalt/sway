export type RenderFn = ($$anchor: Node) => void;

export type ComponentContext<
    Props extends Record<string, any> = {},
    Slots extends Record<string, RenderFn> = {},
> = {
    $$anchor: Node;
    $$props: Props,
    $$slots: Slots,
};

export type Component<
    Props extends Record<string, any> = {},
    Slots extends Record<string, RenderFn> = {},
    Exports extends Record<string, any> = {}
> = (context: ComponentContext<Props, Slots>) => Exports;

export type TagName = keyof HTMLElementTagNameMap | "text";
export type NodeCount = Partial<Record<TagName, number>>;
