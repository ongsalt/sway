# Sway
### 🌟☄️🌸🎼
svelte 5 clone (hopefully)

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
- `each` syntax should be ok now. see [each.ts](packages/sway/lib/runtime/each.ts) for more technical note. 
- value binding for `input` and `textarea`
    - auto coerce type to number for `<input type="number">`
    - the same go for checkbox
- Dynamic attribute `class="border {someExpression}"` or `placeholder={anotherExpression}`
- a reactive proxy like vue `reactive` for deep reactivity
    - we also do array patching.
- pass getter and setter instead of a `Signal` to a binding 
- Component
    - no generated props type becuase im too lazy 
    - you can access props via `$$props`
    - `mount(...)`, `#if`, `#each`, `#key (not yet implemented)` do produce effect scope.
- shorthand props syntax `name={name}` -> `{name}`, `bind:name={name}` -> `bind:name`
- lifecycle hooks: `onMount`, `onDestroy`
- Component instance binding `bind:this`
    - you cant use `export function something(...)` syntax yet. for now use `$$exports.something = ...`

## What's not yet
- think about each binding: should we make each item a signal or not.
- parse more complex expression here `#each {expression} as something, index`
    - `#each cats.filter(it => it.id.length < lenght) as cat, i`
    - currently, this is parse failure 
- Async stuff
    - await block
    - some kind of react-like suspense boundary
    - async derived 💀💀💀 
- ~~do transpiling magic that allow you to use signal without `.value` like runes~~
- typescript support 
    - type definitions of stuff exported form `sway` is for some reason all gone when used in `.sway` file. maybe its becuase of svelte lsp
- SSR
    - i need to create a new transformer and maybe a new parser too
    - hydration look like pain in the ass
    - think about vite integration or may be we could offload this to `sway/kit` lmao
- a router (or `sway/kit`, beside from ssr thing this look quite fun to make, especially ts magic for PageData)
- [realworld](https://github.com/gothinkster/realworld) (frontend only)
- value binding for `select`
- scoped style

### Unlikely to implement
- `:else` block under `#each` 
- transition, animation

## Packages
- [packages/sway](packages/sway) core framework
    - it export signal primitives
    - there are also `sway/compiler` and `sway/runtime`
- [packages/vite-plugin-sway](packages/vite-plugin-sway) vite plugin for .sway template 
- [playgrounds/development](playgrounds/development) a vite project to experiment with the framework. If you want to try sway you should play around with package. 
- [playgrounds/server](playgrounds/server) nothing yet
