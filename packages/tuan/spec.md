# TODO
- [ ] compiler/templating
    - [x] throw error if any there is a reference to `$` in scope because the user should not use jqeury
    - [x] get path of the node that access a signal 
    - [x] auto update
    - [ ] if/else
        - use comment as an anchor for hidden node
    - [ ] each
    - [x] event listener
        - It's painful to parse `onclick={}` so for now use `onclick="{}"` instead
          so i don't have to create a custom parser (or should i tho)
        - [ ] should remove all event listener from the template and attach it with generated code instead
- [ ] Signal
    - [ ] effect
        - [ ] disposing function 
        - [x] auto retrack 
    - [ ] batched dom update
        - by defualt svelte (user)effect will run after templateEffect
- [ ] bind:this
- [ ] vite plugin 
    - [x] allow direct component import
    - [ ] transpile ts


## Low priority
- [ ] Keyed
- [ ] Component
- [ ] scoped css
- [ ] Faux react
    - [ ] jsx support
    - [ ] transpile ternary and array.map in the template
    - [ ] useState that is a fucking signal with syntactic sugar
    - [ ] other hook too

# Notes
- parse html template first becuase of bind:this
- parse html template to some kind of nested templateEffect
- templateEffect should take currentNode into account
- how tf do i 
    - implement Key
    - implement component props binding 
```html
<script lang="ts">
    let desciription = signal("sdjfhgiu")
</script>

<main>
    <h1> Title </h1>
    <p>description: {description.value}</p>
</main>
```
into (mostly copied from svelte)
```ts
const root = $.template(`<main> <h1>Title</h1> <p> </p> <main/>`)
function component($$context) {
    let desciription = signal("sdjfhgiu")

    let node = root() // The node here might be a wrapper of an HTMLElement 
    let text = $.at(node, [0, 1])

    $.templateEffect(() => {
        // Look like svelte will use $.get instead of direct .value access
        // this might have something to do with current component scope or something 
        $.setText(text, `description: ${description.value}`)
    })

    $.append($$context.anchor, node)
}
```

- name collision
    - just prefix every thing with __generated\_\_ or $