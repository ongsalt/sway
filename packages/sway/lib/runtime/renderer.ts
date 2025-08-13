import { templateEffect } from "./reactivity";
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
>(config: HostConfig<HostNode, HostElement, HostEvent>) {

  function create(definition: NodeDefinition<HostNode>): HostNode {
    if (definition.type === "text") {
      return config.createText(definition.text);
    }

    if (definition.type === "comment") {
      return config.createComment();
    }

    const element = config.createElement(definition.tag);
    for (const [key, value] of Object.entries(definition.attributes ?? {})) {
      config.setAttribute(element, key, value);
    }

    for (const c of definition.children ?? []) {
      config.appendChild(element, create(c));
    }

    return element;
  }

  const renderer: SwayRenderer<HostNode, HostElement, HostEvent> = {
    // TODO: these 2 should be merged
    // we also need getParent, getFisrtChild, getNextSibling
    append(anchor, fragment) {
      config.append(anchor, fragment);
    },
    appendChild(parent, node) {
      config.appendChild(parent, node);
    },
    child(fragment, index) {
      return config.getChild(fragment, index);
    },
    comment(text) {
      return config.createComment(text);
    },
    remove(node) {
      config.removeNode(node);
    },
    sweep(from, to) {
      let current = config.getNextSibling(from);
      while (current !== to) {
        const toRemove = current!;
        if (current) {
          current = config.getNextSibling(current);
          config.removeNode(toRemove);
        }
      }
    },
    setText(node, text) {
      config.setText(node, text);
    },
    createElement(type) {
      return config.createElement(type);
    },
    create,
    createText(text) {
      return config.createText(text ?? "");
    },
    createStaticContent(content) {
      if (config.createStaticContent) {
        return config.createStaticContent!(content);
      }
      throw new Error("Omitting config.createStaticContent is not yet supported. This needs to be a compiler flag too");
    },
    bind(node, key, getter, setter) {
      const valueProxy = createValueProxy(getter, setter);
      config.createBinding(node, key, valueProxy);
    },
    setAttribute(element, attribute, value) {
      config.setAttribute(element, attribute, value);
    },
    listen(element, type, createListener) {
      // generic impl
      templateEffect(() => {
        const listener = createListener();
        config.addEventListener(element, type, listener);

        return () => {
          config.removeEventListener(element, type, listener);
        };
      });
    }
  };


  return renderer;
}

