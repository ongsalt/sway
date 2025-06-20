import { Node } from "estree";
import { TextOrInterpolation } from "../../parse/ast";

export type EstreeNode = {
    type: "estree",
    node: Node;
};

export type AnyStatement = {
    type: "any",
    body: string;
};

export type UserScriptStatement = {
    type: "user-script",
    body: string;
};

export type AttributeUpdatingStatement = {
    type: "attribute-updating",
    accessor: string,
    key: string, // textContent, class, ...
    texts: TextOrInterpolation[],
};

export type TextSettingStatement = {
    type: "text-setting",
    accessor: string,
    texts: TextOrInterpolation[];
};


export type TemplateScopeStatement = {
    type: "template-scope",
    body: SwayStatement[];
};

export type TemplateEffectStatement = {
    type: "template-effect",
    body: SwayStatement[];
};

export type TemplateIfStatement = {
    type: "if",
    condition: string,
    anchor: string,
    blockName: string,
    fragment: string;
    body: SwayStatement[],

    else?: {
        // can we use same anchor???
        // anchor: string,
        fragment: string;
        blockName: string,
        body: SwayStatement[];
    };
};

export type TemplateEachStatement = {
    type: "each",
    anchor: string,
    fragment: string,
    iteratable: string,
    as?: string,
    index?: string,
    key?: string;
    body: SwayStatement[];
};

export type TemplateDefinitionStatement = {
    type: "template-definition",
    name: string,
    template: string,
};

export type TemplateInitStatement = {
    type: "template-init",
    name: string,
    templateName: string,
};

export type AccessorDefinitionStatement = {
    type: "accessor-definition";
    name: string,
    parent: string,
    mode: "sibling" | "children",
    index?: number;
};


export type ComponentDeclarationStatement = {
    type: "component-declaration",
    before: SwayStatement[],
    name: string,
    body: SwayStatement[];
    after: SwayStatement[],
};

export type AppendStatement = {
    type: "append",
    anchor: string,
    node: string;
};

export type EventListenerAttachingStatement = {
    type: "event-listener",
    node: string,
    event: string,
    listenerFn: string;
};

export type BindingStatement = {
    type: "binding",
    node: string,
    key: string,
    binding: Binding;
};

export type Binding = {
    kind: "functions",
    setter: string, // user code
    getter: string;
} | {
    kind: "variables",
    name: string;
};


export type SwayContainerStatement = TemplateScopeStatement | TemplateIfStatement | TemplateEachStatement | TemplateEffectStatement;

export type SwayStatement = TemplateEffectStatement | AccessorDefinitionStatement | TemplateEachStatement | TemplateIfStatement | TemplateDefinitionStatement
    | TemplateScopeStatement | TextSettingStatement | AttributeUpdatingStatement
    | EstreeNode | AnyStatement | ComponentDeclarationStatement | UserScriptStatement
    | TemplateInitStatement | AppendStatement | EventListenerAttachingStatement
    | BindingStatement;

export function priority(statement: SwayStatement) {
    switch (statement.type) {
        // case "accessor-definition":
        //     return -1;
        case "if":
        case "each":
        case "template-effect":
            return 1;

        default:
            return 0;
    }

}