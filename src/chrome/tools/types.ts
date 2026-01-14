/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import { ToolDefinition, ToolHandlers } from "../../core";


/**
 * Tool Pack structure
 * Contains both definitions (for tools/list) and handlers (for tools/call)
 */
export interface ToolPack {
    definitions: ToolDefinition[];
    handlers: ToolHandlers;
}

/**
 * Merge multiple tool packs into one
 */
export function mergeToolPacks(packs: ToolPack[]): ToolPack {
    const definitions: ToolDefinition[] = [];
    const handlers: ToolHandlers = {};

    for (const pack of packs) {
        definitions.push(...pack.definitions);
        Object.assign(handlers, pack.handlers);
    }

    return {
        definitions,
        handlers,
    };
}

/**
 * Tool metadata for agent decision-making
 */
export interface ToolMeta {
    dangerous?: boolean;
    requiresPermissions?: string[];
    scopes?: string[];
    side_effects?: string[];
}
