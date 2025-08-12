import { Component, RenderFn } from "../types";
import { MountOptions } from "./dom";
import { bind } from "./dom/binding";
import { each } from "./each";
import { _if, IfEffect } from "./if";
import { effect, effectScope, getActiveComponentScope, pop, push, Signal, templateEffect } from "./reactivity";
import { createValueProxy, type ValueProxy } from "./utils/reactivity";

export interface HostConfig<HostNode, HostElement extends HostNode, HostEvent> {
  createComment(text?: string): HostNode;
  createElement(type: any): HostElement; // use when !staticTemplateParsing
  createText(text: string): HostNode;

  setText(node: HostNode, text: string): void;

  append(anchor: HostNode, node: HostNode | HostNode[]): void;
  removeNode(node: HostNode): void;

  appendChild(parent: HostNode, fragment: HostNode): void; // use when !staticTemplateParsing || no initial anchor specified 
  getChild(node: HostNode, index: number): HostNode | null;
  getNextSibling(node: HostNode): HostNode | null;

  // TODO: fallback 
  createStaticContent?(content: string): () => HostNode | HostNode[];

  setAttribute(element: HostElement, key: string, value: any): void;

  // very dom thing, should this be in setAttribute?
  addEventListener(element: HostElement, type: any, callback: (event: HostEvent) => any): void;
  removeEventListener(element: HostElement, type: any, callback: (event: HostEvent) => any): void;

  // TODO: think about this: the user should not mess with effect in this
  createBinding<T>(node: HostNode, key: string, valueProxy: ValueProxy<T>): void;
}

export type NodeDefinition<HostNode> =
  { type: "comment"; } |
  {
    type: "text";
    text: string;
  } | {
    type: | "element";
    tag: any;
    attributes?: Record<string, string>;
    children?: NodeDefinition<HostNode>[];
    // only use when its textNode
  };

export interface SwayRenderer<HostNode, HostElement extends HostNode = HostNode, HostEvent = any> {
  child(fragment: HostNode, index: number): HostNode | null;
  // next(skip?: number): HostNode; // unused

  append(anchor: HostNode, fragment: HostNode | HostNode[]): void;
  appendChild(parent: HostNode, fragment: HostNode): void; // use when !staticTemplateParsing || no initial anchor specified 

  comment(text?: string): HostNode;
  remove(node: HostNode): void;
  sweep(from: HostNode, to: HostNode | null): void;
  setText(node: HostNode, text: string): void;

  createText(text?: string): HostNode;
  createElement(type: any): HostElement;
  create(definition: NodeDefinition<HostNode>): HostNode;
  createStaticContent(content: string): () => HostNode[] | HostNode;

  setAttribute(element: HostElement, attributes: string, value: any): void;

  // These depend on reactivity
  listen(element: HostElement, type: string, createListener: () => (event: HostEvent) => any): void;
  bind<T>(node: HostNode, key: string, getter: () => T, setter: (value: T) => unknown): void;
}

// Generic
// these will depends on compiler flag
// $.staticContent(content: string): ($$renderer) => HostNode
// $.staticContent(content: ($$renderer) => HostNode): ($$renderer) => HostNode

export function createRenderer<
  HostNode,
  HostElement extends HostNode,
  HostEvent
>(renderer: HostConfig<HostNode, HostElement, HostEvent>) {

  function create(definition: NodeDefinition<HostNode>): HostNode {
    if (definition.type === "text") {
      return renderer.createText(definition.text);
    }

    if (definition.type === "comment") {
      return renderer.createComment();
    }

    const element = renderer.createElement(definition.tag);
    for (const [key, value] of Object.entries(definition.attributes ?? {})) {
      renderer.setAttribute(element, key, value);
    }

    for (const c of definition.children ?? []) {
      renderer.appendChild(element, create(c));
    }

    return element;
  }

  const runtime: SwayRenderer<HostNode, HostElement, HostEvent> = {
    append(anchor, fragment) {
      renderer.append(anchor, fragment);
    },
    appendChild(parent, node) {
      renderer.appendChild(parent, node);
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
      while (current !== to) {
        const toRemove = current!;
        if (current) {
          current = renderer.getNextSibling(current);
          renderer.removeNode(toRemove);
        }
      }
    },
    setText(node, text) {
      renderer.setText(node, text);
    },
    createElement(type) {
      return renderer.createElement(type);
    },
    create,
    createText(text) {
      return renderer.createText(text ?? "");
    },
    createStaticContent(content) {
      if (renderer.createStaticContent) {
        return renderer.createStaticContent!(content);
      }
      throw new Error("Omitting renderer.createStaticContent is not yet supported. This needs to be a compiler flag too");
    },
    bind(node, key, getter, setter) {
      const valueProxy = createValueProxy(getter, setter);
      renderer.createBinding(node, key, valueProxy);
    },
    setAttribute(element, attribute, value) {
      renderer.setAttribute(element, attribute, value);
    },
    listen(element, type, createListener) {
      // generic impl
      templateEffect(() => {
        const listener = createListener();
        renderer.addEventListener(element, type, listener);

        return () => {
          renderer.removeEventListener(element, type, listener);
        };
      });
    },
  };

  return runtime;
}

export function createRuntime<
  HostNode,
  HostElement extends HostNode,
  HostEvent
>(
  host: HostConfig<HostNode, HostElement, HostEvent>
) {
  const renderer = createRenderer(host);

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
        $$runtime: runtime
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
    bindThis<T>(setter: (value: T) => void, instance: T) {
      const scope = getActiveComponentScope();
      scope?.defer(() => setter(instance), 1);
    },
    if(anchor: HostNode, effect: IfEffect<HostNode>) {
      _if(runtime, anchor, effect);
    },
    each<T>(anchor: HostNode, collection: () => T[], children: (anchor: HostNode, value: T, index: Signal<number>) => void, keyFn: () => any) {
      each<T, HostNode>(renderer, anchor, collection, children, keyFn);
    },
    key(anchor: HostNode, keyFn: () => any, children: () => void) {
      throw new Error("key is unimplemented");
    },
    pop() {
      pop();
    },
    push() {
      push();
    },
    mount
  };

  return runtime;
}
