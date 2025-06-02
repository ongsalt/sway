# Sway
### 🌟☄️🌸🎼
svelte 5 clone (hopefully)

wow doing signal is fun

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
- `each` syntax shuold be ok now. see [each.ts](packages/sway/lib/runtime/each.ts) for more technical note. 
- value binding for `input` and `textarea`
    - auto coerce type to number for `<input type="number">`
    - the same go for checkbox
- deeply reactive object
- Dynamic attribute `class="border {someExpression}"` or `placeholder={anotherExpression}`

## What's not yet
- you cant do binding under each block yet (WIP)
- value binding for `select`
- ~~do transpiling magic that allow you to use signal without `.value` like runes~~
- Component
- typescript support 
    - i dont know if i need to mess with vite or not. ts might work without any change (untested)
- SSR
    - i need to create a new transformer and maybe a new parser too
    - hydration look like pain in the ass
    - think about vite integration or may be we could offload this to `sway/kit` lmao
- a router (or `sway/kit`, beside from ssr thing this look quite fun to make, especially ts magic for PageData)
- [realworld](https://github.com/gothinkster/realworld) (frontend only)

### Unlikely to implement
- `:else` block under `#each` 
- transition

## Packages
- [packages/sway](packages/sway) core framework
    - it export signal primitives
    - there are also `sway/compiler` and `sway/runtime`
- [packages/vite-plugin-sway](packages/vite-plugin-sway) vite plugin for .sway template 
- [playgrounds/development](playgrounds/development) a vite project to experiment with the framework. If you want to try sway you should play around with package. 
- [playgrounds/server](playgrounds/server) nothing yet
