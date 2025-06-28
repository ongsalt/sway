import type { ComponentContext } from "sway";
import { raylibRenderer, RaylibRenderer } from "./renderer";
import type { RaylibEvent, ElementNode } from "./renderer";
import { createRuntime } from "sway/runtime";

// Create the runtime with our raylib renderer
const { mount, runtime } = createRuntime(raylibRenderer);

// Create a simple component
const App = ({ $$anchor, $$props, $$slots, $$runtime }: ComponentContext) => {
  // Create root container
  const root = $$runtime.createElement("div");
  $$runtime.setAttribute(root, "width", 400);
  $$runtime.setAttribute(root, "height", 300);
  $$runtime.setAttribute(root, "color", "lightgray");
  $$runtime.append($$anchor, root);

  // Add title text
  const title = $$runtime.createElement("text");
  $$runtime.setAttribute(title, "text", "Hello Raylib!");
  $$runtime.setAttribute(title, "fontSize", 24);
  $$runtime.setAttribute(title, "color", "black");
  $$runtime.append(root, title);

  // Add button
  const button = $$runtime.createElement("button");
  $$runtime.setAttribute(button, "text", "Click Me!");
  $$runtime.setAttribute(button, "width", 120);
  $$runtime.setAttribute(button, "height", 40);
  $$runtime.append(root, button);

  // Add click handler
  $$runtime.listen(button, "click", () => {
    return (event: RaylibEvent) => {
      console.log("Button clicked!", event);
      // Change button text
      $$runtime.setAttribute(button, "text", "Clicked!");
      $$runtime.setAttribute(button, "color", "green");
    };
  });

  return {};
};


// Initialize and run
export function runExample(): void {
  const renderer = new RaylibRenderer();
  renderer.initialize(800, 600, "Sway + Raylib Example");

  // Create root element
  const rootElement = raylibRenderer.createElement("root");
  renderer.setRoot(rootElement);

  // Mount the app
  const { destroy } = mount(App, {
    root: rootElement,
    props: {},
  });

  console.dir(rootElement, { depth: null });

  // Main game loop
  while (!renderer.shouldClose()) {
    renderer.handleInput();
    renderer.render();
  }

  // Cleanup
  destroy();
  renderer.close();
}

// Uncomment to run the example
// runExample();
