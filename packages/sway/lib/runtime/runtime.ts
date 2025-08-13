import type { Component } from "../types";
import type { MountOptions } from "./dom";
import { computed, effect, effectScope, getActiveComponentScope, pop, push, raw, signal, templateEffect, untrack, type Signal } from "./reactivity";
import { createRenderer, type HostConfig, type SwayRenderer } from "./renderer";
import { each } from "./each";
import { _if, type IfEffect } from "./if";
import { staticContent } from "./static";

export function toRuntime<
  HostNode,
  HostElement extends HostNode,
  HostEvent
>(
  renderer: SwayRenderer<HostNode, HostElement, HostEvent>
) {
  function mount<
    Props extends Record<string, any> = {},
    Exports extends Record<string, any> = {}
  >(
    component: Component<Props, {}, Exports>,
    options: MountOptions<Props, HostNode>
  ) {
    let anchor = options.anchor;
    if (!anchor) {
      anchor = renderer.comment();
      renderer.appendChild(options.root, anchor);
    }

    const scope = effectScope();
    const bindings = scope.run(() => {
      return component({
        $$anchor: anchor,
        $$props: options.props,
        $$slots: {},
      });
    });

    const destroy = () => {
      renderer.sweep(anchor, null); // idk to where tho, TODO: maybe setup an end anchor
      scope.destroy();
    };

    return { bindings, destroy };
  }

  const runtime = {
    ...renderer,
    staticContent,
    bindThis<T>(setter: (value: T) => void, instance: T) {
      const scope = getActiveComponentScope();
      scope?.defer(() => setter(instance), 1);
    },
    if(anchor: HostNode, effect: IfEffect<HostNode>) {
      _if(renderer, anchor, effect);
    },
    each<T>(anchor: HostNode, collection: () => T[], children: (anchor: HostNode, value: T, index: Signal<number>) => void, keyFn: () => any) {
      each<T, HostNode>(renderer, anchor, collection, children, keyFn);
    },
    key(anchor: HostNode, keyFn: () => any, children: () => void) {
      throw new Error("key is unimplemented");
    },
    mount,

    pop,
    push,
    effectScope,
    effect,
    signal,
    computed,
    raw,
    untrack,
    templateEffect,
  };

  return runtime;
}


export function createRuntime<
  HostNode,
  HostElement extends HostNode,
  HostEvent
>(config: HostConfig<HostNode, HostElement, HostEvent>) {
  const renderer = createRenderer(config);
  return toRuntime(renderer);
}