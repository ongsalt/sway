
export interface Renderer<Node, Element extends Node, Fragment extends Node> {
  createFragment(): Fragment;
  createComment(text?: string): void;

  createText(text: string): Node;
  setText(node: Node, text: string): void;

  appendNode(node: Node | Fragment, after: Node): void;
  removeNode(node: Node): void;

  getChildren(node: Node): Node[];
  getNextSibling(node: Node): Node | null;

  // TODO: fallback 
  createStaticContent?(content: string): Fragment;

  setAttribute(element: Element, key: string, value: any): void;
  // very dom thing, should this be in setAttribute?
  addEventListener(element: Element): void;
  removeEventListener(element: Element): void;
}
