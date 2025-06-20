export type Result<T, E = undefined> = {
    ok: false,
    value?: undefined,
    error: E
} | {
    ok: true,
    value: T
    error?: undefined
}

export function unreachable(x: never): never {
    throw new Error("Didn't expect to get here");
}
