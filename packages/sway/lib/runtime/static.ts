import { NodeDefinition, SwayRenderer } from "./renderer";

type StaticPartBuilder<HostNode> = (runtime: SwayRenderer<HostNode>) => HostNode | HostNode[];

// TODO: directly pass in renderer here
export function staticContent<HostNode>(content: string | NodeDefinition<HostNode>[] | StaticPartBuilder<HostNode>) {
  const fns = new Map<SwayRenderer<HostNode>, StaticPartBuilder<HostNode>>();

  // realisticly who tf gonna run same component in 2 runtime
  return function (runtime: SwayRenderer<HostNode>) {
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