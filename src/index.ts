/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

// Export core as main entry point
export * as core from './core';

// Re-export commonly used types and functions for convenience
export { createRouter } from './core/router';
export { ok, err } from './core/errors';
export { validateParams } from './core/validate';

export type {
    ToolDefinition,
    ToolHandler,
    ToolHandlers,
    RouterContext,
    RouterConfig,
    Router,
    ToolResult,
} from './core/types';

export type {
    McpRequest,
    McpResponse,
    ToolsListRequest,
    ToolsCallRequest,
    ToolInfo,
    ContentItem,
    TextContent,
    ImageContent,
} from './core/protocol';
