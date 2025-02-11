import { append, comment, sweep } from "./dom";
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

    const render: RenderDelegationFn = (init, newKey = true) => {
        if (key !== newKey) {
            if (key !== undefined) {
                // console.log("remove previous one")
                // wait... if there is a component under this we need to call its cleanup fns
                sweep(anchor, endAnchor)
            }
            if (init) {
                // console.log(`Init new content`)
                init!(anchor)
            }
        }
        key = newKey;
    }

    templateEffect(() => {
        ifEffect(render)
    })
}

export { _if as if };

