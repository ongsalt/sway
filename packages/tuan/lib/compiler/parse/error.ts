export type ErrorKind = "expected" | "invalid" | "stop-signal"

export class ParserError extends Error {
    constructor(public kind: ErrorKind,message: string) {
        super(`${kind}: ${message}`);
    }
}
