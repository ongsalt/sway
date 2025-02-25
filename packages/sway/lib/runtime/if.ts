import { append, comment, sweep } from "./dom";
import { RuntimeIfScope, swayContext } from "./scope";
import { templateEffect } from "./signal";

// TODO: transformer: avoid this type of name collision

export type RenderFn = ($$anchor: Node) => void
export type RenderDelegationFn = (fn: RenderFn, key?: boolean) => void
export type IfEffect = ($$render: RenderDelegationFn) => void

// Should anchor be a node
function _if(anchor: Node, ifEffect: IfEffect) {
    const endAnchor = comment();
    append(anchor, endAnchor)

    let key: boolean | undefined;
    const ifScope = new RuntimeIfScope(swayContext.currentScope)

    const render: RenderDelegationFn = (init, newKey = true) => {
        if (key !== newKey) {
            if (key !== undefined) {
                ifScope.dispose()
                sweep(anchor, endAnchor)
            }
            init!(anchor)
        }
        key = newKey;
    }

    templateEffect(() => {
        ifScope.run(() => ifEffect(render))
    })
}

export { _if as if };

