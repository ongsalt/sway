# Sway
### 🌟☄️🌸🎼
svelte-like frontend framework recreation (hopefully)

## What's done
- Templating syntax: literally svelte, you can even use svelte lsp.
    - you can do interpolation e.g. `{count.value}`.
    - `#if` `:else` `:else if`
        - else if is not yet tested
    - one component can contain multiple root nodes. (compiler magic)
- Reactivity: i want it to look like svelte but i hate doing transformation so `.value` it is then. 
    - `signal` behave the same as svelte `$state` except you need to use `.value`. (i should say "more like vue" tho)
    - there is also `effect` and `computed`
- event listener 
    - but if you do `onclick={createFn(a)}` this wont rerun after `a` is changed. this is to be fixed later
- `each` syntax shuold be ok now. see [each.ts](packages/sway/spec.md) for more technical note. 
- value binding for `input` and `textarea`
    - auto coerce type to number for `<input type="number"/>`
    - the same go for checkbox

## What's not yet
    - value binding for `select`
    - do transpiling magic that allow you to use signal without `.value`
    - deeply reactive object
    - dont support property binding yet (`bind:value={a}` is ok but `bind:value={a.b}` is not)
    - you also cant do binding under each block yet
    - Dynamic attribute `claass="border {someExpression}"` or `placeholder={anotherExpression}` 
    - typescript support 
        - i dont know if i need to mess with vite or not. ts might work without any change (untested)

### Unlikely to implement
- `:else` block under `#each` 
- transition


## Packages
- [packages/sway](packages/sway) core framework
    - it export signal primitives
    - there are also `sway/compiler` and `sway/runtime`
- [packages/vite-plugin-sway](packages/vite-plugin-sway) vite plugin for .sway template 
- [playground/development](playground/development) a vite project to experiment with the framework. If you want to try sway you should play around with package. 
- [playground/server](playground/server) nothing yet
