export class WeakArray<T extends WeakKey> {
    items: WeakRef<T>[] = []

    constructor() {

    }

    // ???? do we need this
    clear() {
        this.items = []
    }

    deref(): T[] {
        this.flush()
        return this.items.map(it => it.deref()!)
    }

    forEach(fn: (item: T) => any) {
        this.deref().forEach(fn)
    }

    map<U>(mapper: (item: T) => U): U[] {
        return this.deref().map(mapper)
    }

    push(item: T) {
        this.flush()
        this.items.push(new WeakRef(item))
    }

    private flush() {
        this.items = this.items.filter(it => it.deref() !== undefined)
    }
}