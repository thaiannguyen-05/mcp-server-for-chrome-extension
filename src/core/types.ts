/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { ContentItem } from './protocol';

/**
 * Core type definitions for MCP Extension Library
 */

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties?: Record<string, SchemaProperty>;
        required?: string[];
    };
    annotations?: {
        title?: string;
        category?: string;
        readOnlyHint?: boolean;
    };
}

export interface SchemaProperty {
    type: string;
    description?: string;
    enum?: string[];
    items?: SchemaProperty;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
}

export type ToolHandler = (
    params: Record<string, unknown>,
    context: RouterContext,
) => Promise<ToolResult>;

export interface ToolHandlers {
    [toolName: string]: ToolHandler;
}

export interface ToolResult {
    content: ContentItem[];
    isError?: boolean;
}

export interface RouterContext {
    // Extension-specific context
    tabId?: number;
    frameId?: number;

    // Helpers for extension APIs
    executeScript?: <T>(code: string) => Promise<T>;
    getCurrentTab?: () => Promise<chrome.tabs.Tab>;
    getAllTabs?: () => Promise<chrome.tabs.Tab[]>;
    captureScreenshot?: (options?: chrome.tabs.CaptureVisibleTabOptions) => Promise<string>;

    // Storage helpers
    getStorage?: <T>(key: string) => Promise<T | undefined>;
    setStorage?: <T>(key: string, value: T) => Promise<void>;

    // Custom context data
    [key: string]: unknown;
}

export interface RouterConfig {
    toolDefs: ToolDefinition[];
    handlers: ToolHandlers;
    context?: Partial<RouterContext>;
}

export interface Router {
    handle(message: unknown, context?: Partial<RouterContext>): Promise<unknown>;
    getToolDefinitions(): ToolDefinition[];
    callTool(name: string, params: Record<string, unknown>, context?: Partial<RouterContext>): Promise<ToolResult>;
}
