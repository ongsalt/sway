import { templateEffect } from "../signal";
import { trackAppending } from "./internal";

// TODO: transformer: avoid this type of name collision

export type RenderFn = ($$anchor: Node) => void
export type RenderDelegationFn = (fn: RenderFn, key?: boolean) => void
export type IfEffect = ($$render: RenderDelegationFn) => void

// Should anchor be a node
function _if(anchor: Node, effect: IfEffect) {
    let key: boolean | undefined;
    let newKey: boolean | undefined;
    let init: RenderFn | undefined
    let reset = () => { };

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
                console.log("remove previous one")
                reset();
                reset = () => { };
            }
            if (init) {
                // console.log(`Init new content ${init}`)
                const nodes = trackAppending(() => init!(anchor))
                reset = () => nodes.forEach(it => it.parentNode!.removeChild(it));
            }
            key = newKey;
        }
        init = undefined
        newKey = undefined
    })
}

export { _if as if };