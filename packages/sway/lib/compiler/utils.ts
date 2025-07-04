export type Result<T, E = undefined> = {
    ok: false,
    value?: undefined,
    error: E
} | {
    ok: true,
    value: T
    error?: undefined
}

export function unreachable(message?: string): never {
    throw new Error(`[Unreachable] ${message}`);
}
