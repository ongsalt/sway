import { expect, it, test } from "vitest"
import { findLargestSortedIntersection, getTransformation, Operation, stalinSort } from "../lib/runtime/array"

it("should detect insertion and deletion", () => {
    const before = [1, 2, 3, 4, 5];
    const after = [0, 8, 9, 3, 4, 5];
    const ops = getTransformation(before, after)

    const expectations: Operation<number>[] = [
        {
            type: "remove",
            index: 0,
        },
        {
            type: "remove",
            index: 0,
        },
        {
            type: "insert",
            index: 0,
            item: 0
        },
        {
            type: "insert",
            index: 1,
            item: 8
        },
        {
            type: "insert",
            index: 2,
            item: 9
        }
    ]
    expect(ops).toStrictEqual(expectations)
})

it("should detect insertion and deletion 2", () => {
    const before = [1, 2, 3, 4, 5];
    const after = [1, 3, 8, 4, 5];
    const ops = getTransformation(before, after)

    const expectations: Operation<number>[] = [
        {
            type: "remove",
            index: 1,
        },
        {
            type: "insert",
            index: 2,
            item: 8
        }
    ]
    expect(ops).toStrictEqual(expectations)
})

// it("should detect reordering", () => {
//     const before = [1, 2, 3, 4, 5];
//     const after = [5, 1, 2, 3, 4];
//     const ops = getTransformation(before, after)

//     const expectations: Operation<number>[] = [
//         {
//             type: "remove",
//             index: 1,
//         },
//         {
//             type: "insert",
//             index: 2,
//             item: 8
//         }
//     ]
//     expect(ops).toStrictEqual(expectations)
// })


test('stalin sort', () => {
    expect(stalinSort([1, 2, 3, 4, 5])).toStrictEqual([1, 2, 3, 4, 5])
    expect(stalinSort([1, 0])).toStrictEqual([1])
    expect(stalinSort([8, 23, 2, 1, 4, 6])).toStrictEqual([8, 23])
    // expect(stalinSort([1, 2, 3, 4, 5])).toStrictEqual([1, 2, 3, 4, 5])
})

test('findLargestSortedIntersection', () => {
    const a = [1, 2, 8, 4, 5]
    const b = [10, 9, 1, 3, 4, 5, 12]
    const sequence = findLargestSortedIntersection(a, b)

    expect(sequence).toStrictEqual([1, 4, 5])
})
