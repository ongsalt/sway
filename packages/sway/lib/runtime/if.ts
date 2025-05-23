import { append, comment, sweep } from "./dom";
import { templateEffect, reactiveScope, watch } from "./signal";

// TODO: transformer: avoid this type of name collision

export type RenderFn = ($$anchor: Node) => void;
export type RenderDelegationFn = (fn: RenderFn, key?: boolean) => void;
export type IfEffect = ($$render: RenderDelegationFn) => void;

// Should anchor be a node
function _if(anchor: Node, ifEffect: IfEffect) {
    const endAnchor = comment();
    append(anchor, endAnchor);

    let key: boolean | undefined;
    const scope = reactiveScope();

    const render: RenderDelegationFn = (init, newKey = true) => {
        if (key !== newKey) {
            if (key !== undefined) {
                scope.dispose();
                sweep(anchor, endAnchor);
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
}

export { _if as if };

