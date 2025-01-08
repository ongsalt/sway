export const a = {
    sdjfh: "hsfguii"
}

export type Test = typeof a & {
    b: string
}


export { parse } from "./internal/index"
export { computed, signal, effect } from "./signal"
export { compile } from "./compiler" 