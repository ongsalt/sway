import { createSignal, destroy, get, set, Source, trigger } from "./internal";

export const RAW_VALUE = Symbol("raw-value");
export const RELEASE = Symbol("release");

/*

const o = reactive({
    a: 1,
    b: {
        c: 9,
    }
})

effect(() => console.log(o.b.c)) // this listen to `o.b` and `o.b.c`

o.b.c = 8 // trigger `o.b.c` which is fine

o.b = { 
    c: 7 
}
this trigger both `o.b` we need to clear previous `o.b.c` listener
if not nothing happen but gc wont happen 


*/

const ARRAY_ROOT = Symbol("array-root");
const arrayMutMethods: (keyof any[])[] = ["fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"];

export function createProxy<T>(obj: T): T {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    if (isProxy(obj)) {
        console.log(obj, "is already proxied");
        return obj;
    }
    // only allow plain object, anything else should use normal signal instead
    const isArray = Array.isArray(obj);
    if (Object.getPrototypeOf(obj) !== Object.prototype && !isArray) {
        return obj;
    }

    if (isArray) {
        // @ts-ignore oh pls shut up
        return createArrayProxy(obj);
    }

    // well if we do Function.bind then we can probably accept any class

    // im sorry for looking at svelte impl of these
    const sources = new Map<string | symbol, Source>();


    function release() {
        for (const source of sources.values()) {
            destroy(source);
        }
    }

    return new Proxy(obj, {
        get(target, p, receiver) {
            if (p === RAW_VALUE) {
                return obj; // what is the different from target
            }
            if (p === RELEASE) {
                return release;
            }

            let s = sources.get(p);
            if (!s) {
                const original = Reflect.get(target, p, receiver);
                if (typeof original === "object" && original !== null) {
                    s = createSignal(createProxy(original));
                } else {
                    s = createSignal(original);
                }
                sources.set(p, s);
            }

            const value = get(s);
            if (typeof value === "function" && value !== null) {
                return value.bind(target);
            }
            return value;
        },

        set(target, p, newValue, receiver) {
            Reflect.set(target, p, newValue, receiver);

            let s = sources.get(p);
            if (s) {
                // should we track a property of a function tho
                // if its an proxy then release its properties subscriber
                const value = s.value;
                destroyProxy(value);
                set(s, newValue);
                return true;
            }

            return true;
        },

        has(target, p) {
            if (p === RAW_VALUE || p === RELEASE) {
                return true;
            }

            return Reflect.has(target, p);
        },
    });
}

// TODO: this currently sometime trigger more than needed
// when add an item after delete
export function createArrayProxy<T>(arr: T[]): T[] {
    // only allow array, TODO: validate it at run time
    const array = arr.map(it => createProxy(it));

    const sources = new Map<string | symbol, Source>();

    // console.log dont read any of the props, so we cant track it unless we are doing codegen
    const arrayRoot = createSignal(array);
    sources.set(ARRAY_ROOT, arrayRoot);

    function invalidateArrayIndex() {
        const toInvalidate = [...sources.keys()].filter(it => {
            if (typeof it === "symbol") {
                return false;
            }
            try {
                return !Number.isNaN(parseInt(it));
            } catch {
                return false;
            }
        });

        // TODO: fine grained marking
        trigger(arrayRoot!);
        for (const key of toInvalidate) {
            const s = sources.get(key)!;
            if (key in array) {
                set(s, createProxy(array[key as any]));
            } else {
                destroy(s);
            }
        }
        // we should not lazily create this
        const l = sources.get("lenght");
        if (l) {
            set(l, array.length);
        }
    }

    function release() {
        for (const source of sources.values()) {
            destroy(source);
        }
    }

    return new Proxy(array, {
        get(target, p, receiver) {
            if (p === RAW_VALUE) {
                return array;
            }
            if (p === RELEASE) {
                return release;
            }


            // arghhh
            // vue do wrap every fucking array method
            // how tf does svelte do this
            // 😭😭😭😭
            const rawValue = Reflect.get(target, p, receiver);
            // instead of bind to the og array should we throw in new array of proxies instead
            if (arrayMutMethods.includes(p as any)) {
                // TODO: bind value to array of proxies instead
                const method = (rawValue as (...args: any[]) => any).bind(target);
                return (...args: any[]) => {
                    const ret = method(...args);
                    // we also need to invalidate [index] subscriber
                    invalidateArrayIndex();
                    return ret;
                };
            }

            // other method or lenght
            if (p in Array.prototype) {
                get(arrayRoot!); // track it
                if (typeof rawValue === "function" && rawValue !== null) {
                    return rawValue.bind(target);
                }
                return rawValue;
            }


            // indexing
            let s = sources.get(p);
            if (!s) {
                const original = Reflect.get(target, p, receiver);
                if (typeof original === "object" && original !== null) {
                    s = createSignal(createProxy(original));
                } else {
                    s = createSignal(original);
                }
                sources.set(p, s);
            }

            const value = get(s);
            if (typeof value === "function" && value !== null) {
                return value.bind(target);
            }
            return value;
        },

        set(target, p, newValue, receiver) {
            Reflect.set(target, p, newValue, receiver);

            let s = sources.get(p);
            if (s) {
                // should we track a property of a function tho
                // if its an proxy then release its properties subscriber
                const value = s.value;
                destroyProxy(value);
                set(s, newValue);
                return true;
            }

            return true;
        },

        has(target, p) {
            if (p === RAW_VALUE || p === RELEASE) {
                return true;
            }

            return Reflect.has(target, p);
        },
    });
}

export function destroyProxy(value: object) {
    if (isProxy(value)) {
        // @ts-ignore it WILL always be a fn 
        value[RELEASE]();
    }
}


export function isProxy(value: any): value is object & Record<typeof RAW_VALUE, any> {
    return typeof value === "object" && value !== null && RAW_VALUE in value;
}

export function getRawValue<T>(value: T): T {
    if (!isProxy(value)) {
        console.log("not a proxy");
        return value;
    }

    return value[RAW_VALUE] as T;
}

