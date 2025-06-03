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

export function createProxy<T extends object>(obj: T) {
    // only allow plain object, uss normal signal instead
    const isArray = Array.isArray(obj);
    if (Object.getPrototypeOf(obj) !== Object.prototype && !isArray) {
        return obj;
    }

    // well if we do Function.bind then we can probably accept any class

    // how do we do array tho

    // im sorry for looking into svelte impl of these
    const sources = new Map<string | symbol, Source>();

    if (isArray) {
        sources.set(ARRAY_ROOT, createSignal(sources));
    }

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

            // if its array function then we create a wrapper that will then trigger()
            if (isArray) {
                // arghhh this is pain in the ass
                // vue do wrap every fucking array method
                // svelte use its compiler...
                // both of this is pain in the ass 
                const s = sources.get(ARRAY_ROOT)!;
                const value = Reflect.get(target, p, receiver);
                if (arrayMutMethods.includes(p as any)) {
                    // todo: filter only mutating method
                    const method = (value as (...args: any[]) => any).bind(target);
                    return (...args: any[]) => {
                        const ret = method(...args);
                        trigger(s);
                        return ret;
                    };
                }

                // ok a fucking iterator dont return a proxy 😭😭😭

                // other method or lenght
                if (p in Array.prototype) {
                    get(s); // track it
                    if (typeof value === "function" && value !== null) {
                        return value.bind(target);
                    }
                    return value;
                }

                // [index] accessing
                get(s);
                // then do the same
                console.log(`Fallthrough ${String(p)}`);
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

        // defineProperty(target, property, attributes) {

        // },

        // deleteProperty(target, p) {

        // },
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
        return value;
    }

    return value[RAW_VALUE] as T;
}

