import { RenderFn } from "../types";
import { templateEffect, effectScope } from "./reactivity";
import { SwayRuntime } from "./internal";

// TODO: transformer: avoid this type of name collision

export type RenderDelegationFn<HostNode> = (fn: RenderFn<HostNode>, key?: boolean) => void;
export type IfEffect<HostNode = any> = ($$render: RenderDelegationFn<HostNode>) => void;

// Should anchor be a node
export function _if<HostNode>(runtime: SwayRuntime<HostNode, any, any>, anchor: HostNode, ifEffect: IfEffect<HostNode>) {
    const endAnchor = runtime.comment();
    runtime.append(anchor, endAnchor);

    let key: boolean | undefined;
    const scope = effectScope();

    const render: RenderDelegationFn<HostNode> = (init, newKey = true) => {
        if (key !== newKey) {
            if (key !== undefined) {
                scope.destroy();
                runtime.sweep(anchor, endAnchor);
            }
            // templateEffect below should not track init's dependencies 
            scope.run(() => {
                init!(anchor);
            });
        }
        key = newKey;
    };

    templateEffect(() => {
        ifEffect(render);
    });
};
