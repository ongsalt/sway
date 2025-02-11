# TODO
- [ ] compiler/templating
    - [X] write a fucking parser
    - [x] throw error if any there is a reference to `$` in scope because the user should not use jqeury
    - [x] get path of the node that access a signal 
    - [x] auto update
    - [x] think about array reassingment
    - [x] if/else
        - use comment as an anchor for hidden node
        - svelte use a comment to indicate if/each boundaries (???), probably for component too
    - [x] each
        `each a`
        `each a as b`
        `each a as b (key)`
        `each a as b, index`
        `each a as b, index (key)`
        - [ ] need to make array deeply reactive using proxy or something
    - [x] event listener
        - [x] should remove all event listener from the template and attach it with generated code instead
        - if we directly attach event handler without some kind of metadata (svelte: Node.__attributes) would it be harder to track change????
- [ ] Signal
    - [ ] effect
        - [ ] disposing function 
        - [x] auto retrack 
        - [ ] untrack
    - [ ] batched dom update
        - by defualt svelte (user)effect will run after templateEffect
- [ ] bind:this
- [ ] vite plugin 
    - [x] allow direct component import
    - [ ] transpile ts

see comments in `lib/compiler/compiler.ts` for more detail


## Low priority
- [x] Keyed
- [ ] Component
- [ ] scoped css
- [ ] Faux react
    - [ ] jsx support
    - [ ] transpile ternary and array.map in the template
    - [ ] useState that is a fucking signal with syntactic sugar
    - [ ] other hook too
