import { Component, RenderFn } from "../types";
import { MountOptions } from "./dom";
import { bind } from "./dom/binding";
import { each } from "./each";
import { _if, IfEffect } from "./if";
import { effect, effectScope, Signal, templateEffect } from "./reactivity";

export interface Renderer<HostNode, HostElement extends HostNode, HostFragment extends HostNode, HostEvent> {
  createFragment(): HostFragment;
  createComment(text?: string): HostNode;

  createText(text: string): HostNode;
  setText(node: HostNode, text: string): void;

  appendNode(node: HostNode | HostFragment, after: HostNode): void;
  removeNode(node: HostNode): void;

  // getChildren(node: HostNode): HostNode[];
  getChild(node: HostNode, index: number): HostNode | null;
  getNextSibling(node: HostNode): HostNode | null;

  // TODO: fallback 
  createStaticContent?(content: string): () => HostFragment;

  setAttribute(element: HostElement, key: string, value: any): void;

  // very dom thing, should this be in setAttribute?
  addEventListener(element: HostElement, type: any, callback: (event: HostEvent) => any): void;
  removeEventListener(element: HostElement, type: any, callback: (event: HostEvent) => any): void;

  // TODO: think about this: the user should not mess with effect in this
  createBinding<T>(node: HostNode, key: string, getter: () => T, setter: () => unknown): void;
}

export interface SwayRuntime<HostNode, HostElement extends HostNode = HostNode, HostEvent = any> {
  child(fragment: HostNode, index: number): HostNode | null;
  // next(skip?: number): HostNode; // unused

  append(anchor: HostNode, fragment: HostNode): void;
  comment(text?: string): HostNode;
  remove(node: HostNode): void;
  sweep(from: HostNode, to: HostNode | null): void;
  setText(node: HostNode, text: string): void;

  static(content: string): () => HostNode;

  setAttribute(element: HostElement, attributes: string, value: any): void;

  // These depend on reactivity
  listen(element: HostElement, type: string, createListener: () => (event: HostEvent) => any): void;
  bind<T>(node: HostNode, key: string, getter: () => T, setter: () => unknown): void;

  if(anchor: HostNode, effect: IfEffect): void;
  each<T>(
    anchor: HostNode,
    collection: () => T[],
    children: (anchor: HostNode, value: T, index: Signal<number>) => void
  ): void;
  key(anchor: HostNode, keyFn: () => any, children: (anchor: HostNode) => void): void;
}

export function createRenderer<
  HostNode,
  HostElement extends HostNode,
  HostFragment extends HostNode,
  HostEvent
>(renderer: Renderer<HostNode, HostElement, HostFragment, HostEvent>) {
  const runtime: SwayRuntime<HostNode, HostElement, HostEvent> = {
    append(anchor, fragment) {
      // TODO: handle fragment?
      renderer.appendNode(fragment, anchor);
    },
    child(fragment, index) {
      return renderer.getChild(fragment, index);
    },
    comment(text) {
      return renderer.createComment(text);
    },
    remove(node) {
      renderer.removeNode(node);
    },
    sweep(from, to) {
      let current = renderer.getNextSibling(from);
      while (current != to) {
        const toRemove = current!;
        if (current) {
          current = renderer.getNextSibling(current);
        } else {
          current = null;
        }
        renderer.removeNode(toRemove);
      }
    },
    setText(node, text) {
      renderer.setText(node, text);
    },
    static(content) {
      if (renderer.createStaticContent) {
        return renderer.createStaticContent!(content);
      }

      throw new Error("Omitting renderer.createStaticContent is not yet supported. This need to be a compiler flag too");
    },
    if(anchor, effect) {
      _if(runtime, anchor, effect);
    },
    each(anchor, collection, children) {
      each(runtime, anchor, collection, children);
    },

    bind(node, key, getter, setter) {
      renderer.createBinding(node, key, getter, setter);
    },
    setAttribute(element, attribute, value) {
      renderer.setAttribute(element, attribute, value);
    },

    listen(element, type, createListener) {
      // generic impl
      effect(() => {
        const listener = createListener();
        renderer.addEventListener(element, type, listener);

        return () => {
          renderer.removeEventListener(element, type, listener);
        };
      });
    },

    key(anchor, keyFn, children) {
      throw new Error("key is unimplemented");
    },
  };

  function mount<
    Props extends Record<string, any> = {},
    Exports extends Record<string, any> = {}
  >(
    component: Component<Props, {}, Exports>,
    options: MountOptions<Props, HostNode>
  ) {
    let anchor = options.anchor;
    // if (!anchor) {
    //   anchor = runtime.comment();
    //   options.root.appendChild(anchor);
    // }

    const scope = effectScope();
    const bindings = scope.run(() => {
      return component({
        $$anchor: anchor,
        $$props: options.props,
        $$slots: {},
        $$runtime: runtime
      });
    });

    const destroy = () => {
      runtime.sweep(anchor, null); // idk to where tho, TODO: maybe setup an end anchor
      scope.destroy();
    };

    return { bindings, destroy };
  }


  return {
    mount,
    runtime
  };
}