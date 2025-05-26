import { Node } from "estree";
import { TextOrInterpolation } from "../parse/ast";

export type EstreeNode = {
    type: "estree",
    node: Node;
};

export type AnyStatement = {
    type: "any",
    body: string;
};

export type UserEffectStatement = {
    type: "user-effect",
    body: string;
};

export type UserScriptStatement = {
    type: "user-script",
    body: string;
};

export type AttributeUpdatingStatement = {
    type: "attribute-updating",
    target: string,
    key: string, // textContent, class, ...
    isFunction: false, // onclick
    valueExpression: string,
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

// TODO: think about 2way binding in each
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

export type TemplateRootStatement = {
    type: "template-root",
    name: string,
    template: string,
};

export type CreateRootStatement = {
    type: "create-root",
    name: string,
    root: string,
};

export type AccessorDefinitionStatement = {
    type: "accessor-definition";
    name: string,
    parent: string,
    mode: "sibling" | "children",
    index?: number;
};

export type ComponentFunctionStatement = {
    type: "component-function",
    name: string,
    body: SwayStatement[];
};

export type ComponentDeclarationStatement = {
    type: "component-declaration",
    before: SwayStatement[],
    fn: ComponentFunctionStatement,
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
    target: ProxyStatement,
};

// TODO: seperate runtime statement from these
export type ProxyStatement = {
    type: "proxy",
    obj: string,
    key: string | undefined,
};

export type SwayContainerStatement = ComponentFunctionStatement | TemplateScopeStatement | TemplateIfStatement | TemplateEachStatement | TemplateEffectStatement;

export type SwayStatement = TemplateEffectStatement | AccessorDefinitionStatement | TemplateEachStatement | TemplateIfStatement | TemplateRootStatement
    | TemplateScopeStatement | UserEffectStatement | TextSettingStatement | AttributeUpdatingStatement
    | EstreeNode | AnyStatement | ComponentDeclarationStatement | UserScriptStatement
    | ComponentFunctionStatement | CreateRootStatement | AppendStatement | EventListenerAttachingStatement
    | BindingStatement | ProxyStatement;

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