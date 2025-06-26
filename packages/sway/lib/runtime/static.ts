import { NodeDefinition, SwayRuntime } from "./internal";

type StaticPartBuilder<HostNode> = (runtime: SwayRuntime<HostNode>) => HostNode | HostNode[];

export function staticContent<HostNode>(content: string | NodeDefinition<HostNode>[] | StaticPartBuilder<HostNode>) {
  const fns = new Map<SwayRuntime<HostNode>, StaticPartBuilder<HostNode>>();

  // realisticly who tf gonna run same component in 2 runtime
  return function (runtime: SwayRuntime<HostNode>) {
    let fn = fns.get(runtime);
    if (!fn) {
      if (typeof content === "string") {
        fn = runtime.createStaticContent(content);
      } else if (Array.isArray(content)) {
        fn = () => content.map(def => runtime.create(def));
      } else {
        fn = content;
      }
      fns.set(runtime, fn);
    }


    return fn(runtime);
  };
}