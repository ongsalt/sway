export function hasDollarSign(references: Set<string>) {
    for (const identifier of references.values()) {
        if (identifier.startsWith('$')) {
            return true
        }
    }

    return false
}