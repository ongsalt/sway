// in the end we still need some kind of tree for dom update to

type RuntimeIfNode = {
    type: "if"
}

type RuntimeEachNode = {
    type: "each"
}

// we need this when we want to remove it from dom
// or can we just remove everythin between 2 anchor
export type RuntimdeNode = RuntimeIfNode | RuntimeEachNode