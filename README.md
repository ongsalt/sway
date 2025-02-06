
# Tuan (2)
svelte-like frontend framework recreation (hopefully)

>  [!NOTE]  
> ~~currently in the process of rewriting. (i really should have wrote a parser from the beginning)~~ 
> ~~please use commit from Jan 11, 2025 if you want to play around with this~~
> done.

[spec.md](packages/tuan/spec.md) is outdated now.

## Feature
- Templating syntax: Literally svelte, you can use svelte lsp there.
    -  you can do interpolation.
    - `#if` `:else`
        - else if is not yet tested tho
- Reactivity: i want it to look like svelte but i hate doing transformation so `.value` it is then. 
    - `signal` behave the same as svelte `$state` except you need to use `.value`.
    - there is also `effect` and `computed`

### Soon
- Dynamic attribute `class="border {someExpression}"` or `placeholder={anotherExpression}` 
- value binding
- `each` syntax
- event listener 

Parser for these syntax is already implemented.  


## Packages
- [packages/tuan](packages/tuan) the core framework
- [packages/vite-plugin-tuan](packages/vite-plugin-tuan) vite plugin for .tuan template 
- [playground/development](playground/development) a vite project to experiment with the framework
- [playground/server](playground/server) nothing yet
