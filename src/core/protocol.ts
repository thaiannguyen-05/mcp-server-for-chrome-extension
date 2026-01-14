/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * MCP Protocol Message Shapes
 * Based on Model Context Protocol specification
 */

// Request messages
export interface ToolsListRequest {
    method: 'tools/list';
    params?: Record<string, never>;
}

export interface ToolsCallRequest {
    method: 'tools/call';
    params: {
        name: string;
        arguments?: Record<string, unknown>;
    };
}

export type McpRequest = ToolsListRequest | ToolsCallRequest;

// Response messages
export interface ToolInfo {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties?: Record<string, unknown>;
        required?: string[];
    };
}

export interface ToolsListResponse {
    tools: ToolInfo[];
}

export interface TextContent {
    type: 'text';
    text: string;
}

export interface ImageContent {
    type: 'image';
    data: string;
    mimeType: string;
}

export type ContentItem = TextContent | ImageContent;

export interface ToolsCallResponse {
    content: ContentItem[];
    isError?: boolean;
}

export type McpResponse = ToolsListResponse | ToolsCallResponse;

// Error response
export interface McpError {
    code: number;
    message: string;
    data?: unknown;
}

export interface McpErrorResponse {
    error: McpError;
}

// Message envelope (for transport)
export interface McpMessage {
    id?: string | number;
    jsonrpc?: '2.0';
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: McpError;
}
