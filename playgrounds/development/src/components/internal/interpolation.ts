import { ComponentContext, signal } from "tuan"
import * as $ from "tuan/runtime";

const createRoot = $.template('<main><h1>Counter</h1><p>Count {counter.value}</p></main>')

export default function Interpolation($$context: ComponentContext) {
    const root = createRoot();
    let counter = signal(0);

    const text = $.at(root, [0, 1, 0]);


    $.templateEffect(() => $.setText(text, `Count ${counter.value}`));

    $.append($$context.anchor, root)
}
