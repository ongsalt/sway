export const simpleInput = `<main class="m-8 border">
    <p>{show.value}</p>
</main>
`

export const ifElseInput = `<script>
    import { signal, computed, effect } from "tuan";

    const show = signal(true)
    const a = signal("skibidi")

    const toggle = () => { 
        show.value = !show.value
    } 
</script>

<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2">
    <h1 class="text-2xl"> If else test </h1>
    <p>{show.value}</p>
    {#if show.value}
        <h2> First content </h2>
        <p>
            We're <br/>
            No stranger to love 
        </p>
        <p>{a.value}</p>
    {:else if show.value}
        <p>else if</p>
    {:else}
        <h2> Second content </h2>
        <p> Multi root </p>
    {/if}
    <button onclick={toggle} class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white "> increment </button>
</main>`

export const complexIfElseInput = `
<script>
    import { signal, computed, effect } from "tuan";

    const count = signal(1)
    const a = signal(1)
    setInterval(() => {
        a.value += 1
    }, 1000)

    const increment = () => { 
        count.value += 1
    } 
    const decrement = () => { 
        count.value -= 1
    }
</script>

<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2">
    <h1 class="text-2xl"> If else test </h1>
    <p>{count.value}</p>
    {#if a.value < 5}
        <h2> First content </h2>
        <p> We're no strangers to </p>
        <p>{a.value}</p>
    {:else}
        <h2> Second content </h2>
        <p>{a.value}</p>
        <p> Multi root </p>
    {/if}

    <button onclick={increment}>+</button>
    <button onclick={decrement}>-</button>
</main>
`

export const eachInput = `<script>
    import { signal, computed, effect } from "tuan";

    const items = signal([1, 2, 3]);
    let current = 4;

    const add = () => {
        items.value =  [...items.value, current++];
    };
</script>

<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2">
    <h1 class="text-2xl"> Each test </h1>
    {#each items.value as item, index (index)}
        <p> {item} </p>
    {/each}
    <button onclick={add} class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white "> Add </button>
</main>`

export const nestedControlFlowInput = `<script>
    import { signal, computed, effect } from "tuan";

    const items = signal([1, 2, 3]);
    let current = 4;

    const add = () => {
        items.value =  [...items.value, current++];
    };

    const show = signal(true)
    const a = signal("skibidi")

    const toggle = () => { 
        show.value = !show.value
    } 
</script>

<main class="m-8 border rounded-lg shadow-sm p-6 space-y-2">
    <h1 class="text-2xl"> If else test </h1>
    <p>{show.value}</p>
    {#if show.value}
        <h2> First content </h2>
        <p>
            We're <br/>
            No stranger to love 
        </p>
        <p>{a.value}</p>
    {:else}
        <h1 class="text-2xl"> Each test </h1>
        {#each items as item, index (key)}
            <p> {item} </p>
        {/each}
    {/if}
</main>
<button onclick={toggle} class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white"> increment </button>
<button onclick={add} class="rounded bg-blue-500 hover:bg-blue-600 p-2 px-4 text-white"> Add </button>
`
