import { Renderer, SwayRuntime } from "./internal";

type StaticPartBuilder = (runtime: SwayRuntime<any>) => any;

export function staticContent(content: string | StaticPartBuilder) {
  const fns = new Map<any, StaticPartBuilder>();

  // realisticly who tf gonna run same component in 2 runtime
  return function <HostNode>(runtime: SwayRuntime<HostNode>) {
    let fn = fns.get(runtime);
    if (!fn) {
      if (typeof content === "string") {
        fn = runtime.createStaticContent(content);
      } else {
        fn = content;
      }
      fns.set(runtime, fn);
    }

    
    return fn(runtime);
  };
}