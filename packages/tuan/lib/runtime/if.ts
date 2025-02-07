import { CleanupFn, templateEffect, trackEffect } from "../signal";
import { CurrentIf, tuanContext } from "./context";
import { remove, trackAppending } from "./dom";

// TODO: transformer: avoid this type of name collision

export type RenderFn = ($$anchor: Node) => void
export type RenderDelegationFn = (fn: RenderFn, key?: boolean) => void
export type IfEffect = ($$render: RenderDelegationFn) => void

// Should anchor be a node
function _if(anchor: Node, effectFn: IfEffect) {
    const previous = tuanContext.currentScope;
    const scope: CurrentIf = {
        type: "if",
        previous,
        cleanups: [],
        nodes: new Set()
    }

    let key: boolean | undefined;
    let newKey: boolean | undefined;
    let init: RenderFn | undefined

    const prepare: RenderDelegationFn = (fn, _newKey = true) => {
        newKey = _newKey;
        init = fn;
    }

    const reset = () => {
        // console.log("[reset] ------------", scope)
        scope.cleanups.forEach(fn => fn())
        scope.cleanups = []
        // should contain only immediate node
        scope.nodes.forEach(it => {
            previous?.nodes.delete(it)
            remove(it)
        })
        scope.nodes.clear()
    }

    previous?.cleanups.push(reset)

    templateEffect(() => {
        effectFn(prepare) // setting init and newKey

        // console.log({ key, newKey })

        // $$render is gauranteed to be called only one time
        if (key !== newKey) {
            if (key !== undefined) {
                // console.log("remove previous one")
                reset()
            }
            if (init) {
                // console.log(`Init new content`)
                let disposeEffect: CleanupFn;
                const nodes = trackAppending(() => {
                    disposeEffect = trackEffect(() => {
                        tuanContext.currentScope = scope
                        init!(anchor)
                        tuanContext.currentScope = previous;
                    })
                })

                scope.cleanups.push(disposeEffect!)
                nodes.forEach(it => {
                    scope.nodes.add(it)
                    // previous?.nodes.add(it)
                })
            }
            key = newKey;
        }
        init = undefined
        newKey = undefined
    })
}

export { _if as if };
