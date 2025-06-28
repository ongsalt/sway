import type { Renderer } from "sway/runtime";
import r from "raylib";

export type CommentNode = {
  type: "comment";
  parent?: ElementNode;
  nextSibling?: RaylibNode;
};

export type TextNode = {
  type: "text";
  text: string;
  parent?: ElementNode;
  nextSibling?: RaylibNode;
};

export type ElementNode = {
  type: "element";
  parent?: ElementNode;
  children: RaylibNode[];
  nextSibling?: RaylibNode;

  tag: string;
  attributes: Record<string, unknown>;
  eventHandlers: Map<string, (event: RaylibEvent) => unknown>;
};

export type RaylibNode = CommentNode | TextNode | ElementNode;

export interface RaylibEvent {
  type: string;
  x?: number;
  y?: number;
  key?: string;
}

// Renderer implementation
export const raylibRenderer: Renderer<RaylibNode, ElementNode, RaylibEvent> = {
  createComment(text?: string): CommentNode {
    return {
      type: "comment",
    };
  },

  createElement(tag: string): ElementNode {
    return {
      type: "element",
      tag,
      children: [],
      attributes: {},
      eventHandlers: new Map(),
    };
  },

  createText(text: string): TextNode {
    return {
      type: "text",
      text,
    };
  },

  setText(node: RaylibNode, text: string): void {
    if (node.type === "text") {
      node.text = text;
    }
  },

  append(anchor: RaylibNode, nodes: RaylibNode | RaylibNode[]): void {
    const nodeArray = Array.isArray(nodes) ? nodes : [nodes];

    if (anchor.parent) {
      console.log(anchor.parent);
      const parent = anchor.parent;
      const anchorIndex = parent.children.indexOf(anchor);

      for (let i = 0; i < nodeArray.length; i++) {
        const node = nodeArray[i];
        if (node) {
          node.parent = parent;
          parent.children.splice(anchorIndex + 1 + i, 0, node);

          // Update nextSibling references
          if (i === 0) {
            node.nextSibling = anchor.nextSibling;
            anchor.nextSibling = node;
          } else {
            const prevNode = nodeArray[i - 1];
            if (prevNode) {
              prevNode.nextSibling = node;
            }
          }
        }
      }
    }
  },

  removeNode(node: RaylibNode): void {
    if (node.parent) {
      const parent = node.parent;
      const index = parent.children.indexOf(node);
      if (index !== -1) {
        parent.children.splice(index, 1);

        // Update nextSibling references
        const prevNode = index > 0 ? parent.children[index - 1] : null;
        if (prevNode) {
          prevNode.nextSibling = node.nextSibling;
        }

        node.parent = undefined;
        node.nextSibling = undefined;
      }
    }
  },

  appendChild(parent: RaylibNode, child: RaylibNode): void {
    if (parent.type === "element") {
      child.parent = parent;
      parent.children.push(child);

      // Update nextSibling references
      const prevChild = parent.children[parent.children.length - 2];
      if (prevChild) {
        prevChild.nextSibling = child;
      }
    }
  },

  getChild(node: RaylibNode, index: number): RaylibNode | null {
    if (node.type === "element" && index < node.children.length && index >= 0) {
      return node.children[index] || null;
    }
    return null;
  },

  getNextSibling(node: RaylibNode): RaylibNode | null {
    return node.nextSibling || null;
  },

  createStaticContent(content: string): () => RaylibNode | RaylibNode[] {
    return () => {
      // Simple implementation: create a text node with the content
      return this.createText(content);
    };
  },

  setAttribute(element: ElementNode, key: string, value: unknown): void {
    element.attributes[key] = value;
  },

  addEventListener(element: ElementNode, type: string, callback: (event: RaylibEvent) => unknown): void {
    element.eventHandlers.set(type, callback);
  },

  removeEventListener(element: ElementNode, type: string, callback: (event: RaylibEvent) => unknown): void {
    element.eventHandlers.delete(type);
  },

  createBinding<T>(
    node: RaylibNode,
    key: string,
    getter: () => T,
    setter: (value: T) => unknown,
  ): void {
    // Simple binding implementation - could be enhanced for specific use cases
    if (node.type === "element") {
      const value = getter();
      this.setAttribute(node, key, value);
    }
  },
};

function getNearestAttribute(node: RaylibNode, key: string): unknown {
  if (node.type === "comment") {
    return null;
  }

  let current: RaylibNode | undefined = node;
  while (current) {
    if (current.type === "element" && current.attributes[key] !== undefined) {
      return current.attributes[key];
    }
    current = current.parent;
  }

  return null;
}

function parseColor(colorStr: string): r.Color | null {
  if (!colorStr) return null;

  switch (colorStr.toLowerCase()) {
    case "red":
      return r.RED;
    case "green":
      return r.GREEN;
    case "blue":
      return r.BLUE;
    case "black":
      return r.BLACK;
    case "white":
      return r.WHITE;
    case "gray":
      return r.GRAY;
    case "yellow":
      return r.YELLOW;
    default:
      return null;
  }
}

export function measure(
  node: RaylibNode,
): { minWidth: number; maxWidth: number; minHeight: number; maxHeight: number } {
  switch (node.type) {
    case "text": {
      const fontSize = (getNearestAttribute(node, "fontSize") as number) || 20;
      const width = r.MeasureText(node.text, fontSize);
      return {
        minWidth: width,
        maxWidth: width,
        minHeight: fontSize,
        maxHeight: fontSize,
      };
    }
    case "element": {
      const explicitWidth = Number(node.attributes.width);
      const explicitHeight = Number(node.attributes.height);

      // If explicit size is provided, use it.
      if (!isNaN(explicitWidth) && !isNaN(explicitHeight)) {
        return {
          minWidth: explicitWidth,
          maxWidth: explicitWidth,
          minHeight: explicitHeight,
          maxHeight: explicitHeight,
        };
      }

      // If no explicit size, measure children
      let minWidth = 0;
      let maxWidth = 0;
      let minHeight = 0;
      let maxHeight = 0;

      if (node.children.length > 0) {
        // For now, simple vertical stacking logic
        let totalHeight = 0;
        let maxChildWidth = 0;
        for (const child of node.children) {
          const childMeasurement = measure(child);
          totalHeight += childMeasurement.maxHeight + 10; // 10 for spacing
          if (childMeasurement.maxWidth > maxChildWidth) {
            maxChildWidth = childMeasurement.maxWidth;
          }
        }
        minHeight = totalHeight > 0 ? totalHeight - 10 : 0; // remove last spacing
        maxHeight = totalHeight > 0 ? totalHeight - 10 : 0;
        minWidth = maxChildWidth + 20; // 10 padding on each side
        maxWidth = maxChildWidth + 20;
      }

      // For button, consider text size
      if (node.tag === "button") {
        const text = String(node.attributes.text || "Button");
        const textWidth = r.MeasureText(text, 20);
        minWidth = Math.max(minWidth, textWidth + 20); // padding
        maxWidth = Math.max(maxWidth, textWidth + 20);
        minHeight = Math.max(minHeight, 30);
        maxHeight = Math.max(maxHeight, 30);
      }

      return {
        minWidth: !isNaN(explicitWidth) ? explicitWidth : minWidth,
        maxWidth: !isNaN(explicitWidth) ? explicitWidth : maxWidth,
        minHeight: !isNaN(explicitHeight) ? explicitHeight : minHeight,
        maxHeight: !isNaN(explicitHeight) ? explicitHeight : maxHeight,
      };
    }
    case "comment":
      return { minWidth: 0, maxWidth: 0, minHeight: 0, maxHeight: 0 };
  }
}

function renderText(node: TextNode, x: number, y: number): void {
  const fontSize = 20;
  // TODO: getStyle(node, key) that will look up in the parent chain
  // TODO: cache it, not get it every frame
  const color =
    parseColor(getNearestAttribute(node, "color") as string) || r.BLACK;
  r.DrawText(node.text, x, y, fontSize, color);
}

function renderDiv(node: ElementNode, x: number, y: number): void {
  const width = Number(node.attributes.width) || 100;
  const height = Number(node.attributes.height) || 50;
  const color =
    parseColor(getNearestAttribute(node, "color") as string) || r.LIGHTGRAY;

  r.DrawRectangle(x, y, width, height, color);
}

function renderButton(node: ElementNode, x: number, y: number): void {
  const width = Number(node.attributes.width) || 100;
  const height = Number(node.attributes.height) || 30;
  const text = String(node.attributes.text || "Button");
  const textColor =
    parseColor(getNearestAttribute(node, "color") as string) || r.BLACK;

  r.DrawRectangle(x, y, width, height, r.LIGHTGRAY);
  r.DrawRectangleLines(x, y, width, height, r.BLACK);

  const textWidth = r.MeasureText(text, 20);
  const textX = x + (width - textWidth) / 2;
  const textY = y + (height - 20) / 2;
  r.DrawText(text, textX, textY, 20, textColor);
}

function renderTextElement(node: ElementNode, x: number, y: number): void {
  const text = String(node.attributes.text || "");
  const fontSize = Number(node.attributes.fontSize) || 20;
  const color =
    parseColor(getNearestAttribute(node, "color") as string) || r.BLACK;

  r.DrawText(text, x, y, fontSize, color);
}

function renderGenericElement(node: ElementNode, x: number, y: number): void {
  // Basic rectangle representation for unknown elements
  r.DrawRectangleLines(x, y, 50, 20, r.GRAY);
  r.DrawText(node.tag, x + 2, y + 2, 16, r.GRAY);
}

function renderElement(node: ElementNode, x: number, y: number): void {
  // Basic element rendering based on tag
  switch (node.tag) {
    case "div":
      renderDiv(node, x, y);
      break;
    case "button":
      renderButton(node, x, y);
      break;
    case "text":
      renderTextElement(node, x, y);
      break;
    default:
      renderGenericElement(node, x, y);
      break;
  }

  // Render children
  let childY = y + 30; // Basic vertical spacing
  for (const child of node.children) {
    renderNode(child, x + 10, childY);
    childY += 30;
  }
}

function renderNode(node: RaylibNode, x: number, y: number): void {
  switch (node.type) {
    case "text":
      renderText(node, x, y);
      break;
    case "element":
      renderElement(node, x, y);
      break;
    case "comment":
      // Comments don't render visually
      break;
  }
}

export function shouldClose(): boolean {
  return r.WindowShouldClose();
}

// Raylib rendering functions
export class RaylibRenderer {
  private rootNode: ElementNode | null = null;
  private isInitialized = false;

  initialize(
    width: number = 800,
    height: number = 600,
    title: string = "Sway Raylib App",
  ): void {
    if (!this.isInitialized) {
      r.InitWindow(width, height, title);
      r.SetTargetFPS(60);
      this.isInitialized = true;
    }
  }

  setRoot(root: ElementNode): void {
    this.rootNode = root;
  }

  render(): void {
    if (!this.isInitialized || !this.rootNode) return;

    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE);

    renderNode(this.rootNode, 0, 0);

    r.EndDrawing();
  }

  handleInput(): void {
    if (!this.rootNode) return;

    // Handle mouse input
    if (r.IsMouseButtonPressed(r.MOUSE_BUTTON_LEFT)) {
      const mouseX = r.GetMouseX();
      const mouseY = r.GetMouseY();

      this.handleNodeClick(this.rootNode, mouseX, mouseY, 0, 0);
    }

    // Handle keyboard input
    const key = r.GetKeyPressed();
    if (key !== 0) {
      const event: RaylibEvent = {
        type: "keypress",
        key: String.fromCharCode(key),
      };
      this.dispatchEventToNode(this.rootNode, event);
    }
  }

  private handleNodeClick(
    node: RaylibNode,
    mouseX: number,
    mouseY: number,
    nodeX: number,
    nodeY: number,
  ): boolean {
    if (node.type === "element") {
      const width = Number(node.attributes.width) || 100;
      const height = Number(node.attributes.height) || 50;

      // Check if click is within this element's bounds
      if (
        mouseX >= nodeX &&
        mouseX <= nodeX + width &&
        mouseY >= nodeY &&
        mouseY <= nodeY + height
      ) {
        const clickHandler = node.eventHandlers.get("click");
        if (clickHandler) {
          const event: RaylibEvent = {
            type: "click",
            x: mouseX,
            y: mouseY,
          };
          clickHandler(event);
          return true;
        }
      }

      // Check children
      let childY = nodeY + 30;
      for (const child of node.children) {
        if (this.handleNodeClick(child, mouseX, mouseY, nodeX + 10, childY)) {
          return true;
        }
        childY += 30;
      }
    }

    return false;
  }

  private dispatchEventToNode(node: RaylibNode, event: RaylibEvent): void {
    if (node.type === "element") {
      const handler = node.eventHandlers.get(event.type);
      if (handler) {
        handler(event);
      }

      // Propagate to children
      for (const child of node.children) {
        this.dispatchEventToNode(child, event);
      }
    }
  }

  close(): void {
    if (this.isInitialized) {
      r.CloseWindow();
      this.isInitialized = false;
    }
  }
}
