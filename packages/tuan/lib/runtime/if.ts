import { templateEffect } from "../signal";
import { withCleanup } from "./context";

// TODO: transformer: avoid this type of name collision

export type RenderFn = ($$anchor: Node) => void
export type RenderDelegationFn = (fn: RenderFn, key?: boolean) => void
export type IfEffect = ($$render: RenderDelegationFn) => void

// Should anchor be a node
function _if(anchor: Node, effect: IfEffect) {
    let key: boolean | undefined;
    let newKey: boolean | undefined;
    let init: RenderFn | undefined
    let cleanup = () => { };

    const prepare: RenderDelegationFn = (fn, _newKey = true) => {
        newKey = _newKey;
        init = fn;
    }

    templateEffect(() => {
        effect(prepare)
        // console.log({ key, newKey })

        // $$render is gauranteed to be called only one time
        if (key !== newKey) {
            if (key !== undefined) {
                // console.log("remove previous one")
                cleanup();
                cleanup = () => { };
            }
            if (init) {
                // console.log(`Init new content ${init}`)
                cleanup = withCleanup(() => init!(anchor))
            }
            key = newKey;
        }
        init = undefined
        newKey = undefined
    })
}

export { _if as if };
