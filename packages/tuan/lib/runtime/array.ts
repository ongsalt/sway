
// claude wrote this
export type Operation<T> =
    | { type: 'insert', item: T, index: number }
    | { type: 'remove', index: number }
    | { type: 'move', fromIndex: number, toIndex: number };


// priority: amount of node that stay the same (minimize change) > dom updating
// we shouhld do stalin sort

export function stalinSort<T>(input: T[]): T[] {
    if (input.length === 1) {
        return input
    }
    const output = [...input]
    let i = 1;
    while (i < output.length) {
        const previous = input[i - 1]
        const current = input[i]

        if (current < previous) {
            output.splice(i, 1)
        } else {
            i += 1;
        }
    }
    return output
}

export function findLargestSortedIntersection<T>(previous: T[], after: T[]) {
    const intersection = previous.filter(it => after.includes(it))
    let sequence: T[] = []
    // intersection -> [i1] [i1, i2] [i1, i2, i3] ...
    for (let i = 0; i < intersection.length; i++) {
        const normal = stalinSort(intersection.slice(i))

        if (normal.length > sequence.length) {
            sequence = normal
        }
    }

    return sequence;
}

export function getTransformation<T>(previous: T[], after: T[]): Operation<T>[] {
    // TODO: handle reverse, wait why do i reverse
    const sequence = findLargestSortedIntersection(previous, after)
    const operations: Operation<T>[] = [] 
    const workArray = [...previous]

    for (let i = 0; i < workArray.length; i++) {
        const item = workArray[i]
        if (!sequence.includes(item)) {
            workArray.splice(i, 1)
            operations.push({
                type: "remove",
                index: i  
            })
            i--;
        }
    }

    for (let i = 0; i < after.length; i++) {
        const item = workArray[i]
        const expected = after[i]
        if (item !== expected) {
            workArray.splice(i, 0, expected)
            operations.push({
                type: "insert",
                index: i,
                item: expected
            })
            i--;
        }
    }

    // TODO: use element.moveBefore sometime later 
    return operations;
}

