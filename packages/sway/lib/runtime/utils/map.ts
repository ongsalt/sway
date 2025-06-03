type NestedMap<Key, Value> = Map<Key, { index: Value, children: NestedMap<Key, Value> }>

function flatten<Value>(nestedMap: NestedMap<any, Value>): Set<Value> {
    const out = new Set<Value>()
    for (const value of nestedMap.values()) {
        out.add(value.index)
        flatten(value.children).forEach(it => out.add(it))
    }
    return out
}

// export class PathMap<Value> {
//     internal: NestedMap<string | symbol, Value>

//     constructor() {
//         this.internal = new Map()
//     }

//     get(key: (string | symbol)[]): Value | undefined {
//         if (key.length === 0) {
//             return undefined
//         }

//         let current = this.internal;
//         while (key.length > 1) {
//             const k = key.shift()!
//             const c = current.get(k)
//             if (!c) {
//                 return undefined
//             }
//             current = c.children;
//         }

//         return current.get(key.shift()!)?.index
//     }

//     getAll(key: (string | symbol)[]): Set<Value> {
//         if (key.length === 0) {
//             return new Set()
//         }

//         let current = this.internal;
//         while (key.length > 1) {
//             const k = key.shift()!
//             const c = current.get(k)
//             if (!c) {
//                 return new Set()
//             }
//             current = c.children;
//         }

//         const o = current.get(key.shift()!)
//         if (!o) {
//             return new Set()
//         }

//         const out = flatten(o.children);
//         out.add(o.index)
//         return out;
//     }

//     set(key: (string | symbol)[], value: Value) {
//         while (key.length > 0) {
//             const k = key.shift()!
//             let map = this.internal.get(k)?.children
//             if (!map) {
//                 map = new Map()
//                 this.internal.set(k, { children: map, index: va })
//             }

//         }
//     }
// }

type Item<T> = { path: (string | symbol)[], value: T }
export class PathMap<Value> {
    inner: Item<Value>[] = []

    add(path: (string | symbol)[], value: Value) {
        this.inner.push({
            path,
            value
        })
    }

    removeAll(path: (string | symbol)[]) {
        const marked: Item<Value>[] = []
        for (const item of this.inner) {
            if (isInsidePath(item.path, path)) {
                marked.push(item)
            }
        }

        this.inner = this.inner.filter(it => !marked.includes(it))
        return marked.map(it => it.value)
    }

    // wrong
    getAll(path: (string | symbol)[]): Value[] {
        const out: Value[] = []
        for (const item of this.inner) {
            if (isSamePath(item.path, path)) {
                out.push(item.value)
            }
        }

        return out
    }

    delete(value: Value) {
        const marked: Item<Value>[] = []
        for (const item of this.inner) {
            if (item.value === value) {
                marked.push(item)
            }
        }

        this.inner = this.inner.filter(it => !marked.includes(it))
    }

    *[Symbol.iterator]() {
        for (const { value } of this.inner) {
            yield value
        }
    }
    
    clear() {
        this.inner = []
    }
}

function isInsidePath(target: (string | symbol)[], search: (string | symbol)[]) {
    for (let index = 0; index < Math.min(search.length, target.length); index++) {
        if (search[index] !== target[index]) {
            return false
        }
    }

    return true
}

function isSamePath(target: (string | symbol)[], search: (string | symbol)[]) {
    if (search.length !== target.length) {
        return false;
    }

    for (let index = 0; index < search.length; index++) {
        if (search[index] !== target[index]) {
            return false
        }
    }

    return true
}