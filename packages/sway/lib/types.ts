import type { SwayRenderer } from "./runtime";

export type RenderFn<HostNode> = ($$anchor: HostNode) => void;

export type ComponentContext<
    Props extends Record<string, any> = {},
    Slots extends Record<string, RenderFn<any>> = {},
    HostNode = any
> = {
    $$anchor: HostNode;
    $$props: Props,
    $$slots: Slots,
    $$runtime: SwayRenderer<any, any, any>;
};

export type Component<
    Props extends Record<string, any> = {},
    Slots extends Record<string, RenderFn<any>> = {},
    Exports extends Record<string, any> = {}
> = (context: ComponentContext<Props, Slots>) => Exports;

export type TagName = keyof HTMLElementTagNameMap | "text";
export type NodeCount = Partial<Record<TagName, number>>;
