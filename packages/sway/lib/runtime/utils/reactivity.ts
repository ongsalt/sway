import { templateEffect, untrack, type Signal } from "../reactivity";

export type ValueProxy<T> = ReturnType<typeof createValueProxy<T>>;

export function createValueProxy<T>(get: () => T, set: (value: T) => void) {
  return {
    onValue(fn: (value: T) => void) {
      templateEffect(() => {
        fn(get());
      });
    },
    set(value: T) {
      set(value);
    },
    get() {
      return untrack(get);
    }
  };
}