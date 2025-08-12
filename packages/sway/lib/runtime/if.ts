import { RenderFn } from "../types";
import { templateEffect, effectScope } from "./reactivity";
import { SwayRenderer } from "./renderer";

// TODO: transformer: avoid this type of name collision

export type RenderDelegationFn<HostNode> = (fn: RenderFn<HostNode>, key?: boolean) => void;
export type IfEffect<HostNode = any> = ($$render: RenderDelegationFn<HostNode>) => void;

// Should anchor be a node
export function _if<HostNode>(renderer: SwayRenderer<HostNode, any, any>, anchor: HostNode, ifEffect: IfEffect<HostNode>) {
    const endAnchor = renderer.comment();
    renderer.append(anchor, endAnchor);

    let key: boolean | undefined;
    const scope = effectScope();

    const render: RenderDelegationFn<HostNode> = (init, newKey = true) => {
        if (key !== newKey) {
            if (key !== undefined) {
                scope.destroy();
                renderer.sweep(anchor, endAnchor);
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
