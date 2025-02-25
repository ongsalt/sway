export function noop() {

}

export function runAll(fns?: (() => any)[]) {
    if (!fns) {
        return
    }
    for (const fn of fns) {
        fn()
    }
}

export function identity<T>(value: T): T {
    return value
}
