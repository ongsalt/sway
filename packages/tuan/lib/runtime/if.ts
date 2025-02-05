import { templateEffect } from "../signal";
import { trackAppending } from "./internal";

// TODO: transformer: avoid this type of name collision

export type FragmentInitializer = ($$anchor: Node) => void
export type RenderFn = (fn: FragmentInitializer, key?: boolean) => void
export type IfEffect = ($$render: RenderFn) => void

// Should anchor be a node
function _if(anchor: Node, effect: IfEffect) {
    let key: boolean | undefined;
    let newKey: boolean | undefined;
    let init: FragmentInitializer | undefined
    let reset = () => {};

    const prepare: RenderFn = (fn, _newKey = true) => {
        newKey = _newKey;
        init = fn;
    }

    templateEffect(() => {
        // TODO: Clean up anchor and everything else
        effect(prepare)
        // console.log({ key, newKey })

        // $$render is gauranteed to be called only one time
        if (key !== newKey) {
            if (key !== undefined) {
                console.log("remove previous one")
                reset();
                reset = () => {};
                // TODO: how tho
                // Idea 1: track append call
            }
            if (init) {
                // console.log(`Init new content ${init}`)
                const nodes = trackAppending(() => {
                    init!(anchor)
                })
                reset = () => nodes.forEach(it => {
                    console.log(it)
                    it.parentNode!.removeChild(it)
                });
            } 
            key = newKey;
        }
        init = undefined
        newKey = undefined
    })
}

export { _if as if };