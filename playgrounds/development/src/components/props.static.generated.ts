import * as $ from "sway/runtime";

const template = $.staticContent(($$runtime) => {
  const nodes = [];
  const div = $$runtime.createElement(`div`);
  const div_children = []; $$runtime.setAttribute(div, `class`, `border rounded p-4`);
  {
    const h1 = $$runtime.createElement(`h1`);
    const h1_children = []; $$runtime.setAttribute(h1, `class`, `text-lg`);
    {
      const text = $$runtime.createText(` `);
      h1_children.push(text);
      h1_children.forEach(node => $$runtime.appendChild(h1, h1));
    }
    div_children.push(h1);
    const h1_1 = $$runtime.createElement(`h1`);
    const h1_1_children = []; $$runtime.setAttribute(h1_1, `class`, `text-md`);
    {
      const text_1 = $$runtime.createText(` `);
      h1_1_children.push(text_1);
      h1_1_children.forEach(node => $$runtime.appendChild(h1_1, h1_1));
    }
    div_children.push(h1_1);
    const p = $$runtime.createElement(`p`);
    const p_children = []; {
      const text_2 = $$runtime.createText(` `);
      p_children.push(text_2);
      p_children.forEach(node => $$runtime.appendChild(p, p));
    }
    div_children.push(p);
    div_children.forEach(node => $$runtime.appendChild(div, div));
  }
  nodes.push(div);
  return nodes;
}
);

export default function Props({ $$anchor, $$slots, $$props, $$runtime }) {
  $.push();
  const $$exports = {};
  $$exports.a = 8;
  console.log("Init");


  const root_fragment = template($$runtime);
  const div = $$runtime.child(root_fragment, 0);
  const h1 = $$runtime.child(div, 0);
  const text = $$runtime.child(h1, 0);
  $.templateEffect(() => {
    $$runtime.setText(text, `${$$props.names[$$props.index]}`);

  });
  const h1_1 = $$runtime.child(div, 1);
  const text_1 = $$runtime.child(h1_1, 0);
  $.templateEffect(() => {
    $$runtime.setText(text_1, `Next: ${$$props.nextName}`);

  });
  const p = $$runtime.child(div, 2);
  const text_2 = $$runtime.child(p, 0);
  $.templateEffect(() => {
    $$runtime.setText(text_2, `${$$props.index}`);

  });
  $$runtime.append($$anchor, root_fragment);

  $.pop();
  return $$exports;
}
