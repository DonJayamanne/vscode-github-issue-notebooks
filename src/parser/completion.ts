/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QueryNode, Node, NodeType, QueryDocumentNode } from "./nodes";
import { Utils } from "./nodes";
import { ValueType, SymbolTable } from "./symbols";


export const enum CompletionKind {
    Literal,
    ValueType
}

export interface LiteralCompletion {
    type: CompletionKind.Literal;
    value: string;
}

export interface ValueTypeCompletion {
    type: CompletionKind.ValueType;
    valueType: ValueType;
}

export function completeQuery(query: QueryDocumentNode, offset: number, symbols: SymbolTable): Iterable<LiteralCompletion | ValueTypeCompletion> {
    const parents: Node[] = [];
    const node = Utils.nodeAt(query, offset, parents);
    const parent = parents[parents.length - 2];
    if (!node) {
        return [];
    }

    // globals
    if (node === query || node._type === NodeType.Literal) {
        // todo@value
        return [...symbols.all()].map(info => {
            return {
                type: CompletionKind.Literal,
                value: info.name
            };
        });
    }

    // complete a qualified expression
    if (node._type === NodeType.Missing && parent?._type === NodeType.QualifiedValue) {
        const values = symbols.get(parent.qualifier.value);
        if (Array.isArray(values)) {
            let result: LiteralCompletion[] = [];
            for (let set of values) {
                for (let value of set) {
                    result.push({
                        type: CompletionKind.Literal,
                        value
                    });
                }
            }
            return result;

        } else if (values) {
            return [{
                type: CompletionKind.ValueType,
                valueType: values.value as any
            }];
        }
    }

    return [];
};
