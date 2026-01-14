/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type {
    McpMessage,
    McpRequest,
    ToolsListResponse,
    ToolsCallResponse,
} from './protocol';
import { normalizeError, ToolExecutionError } from './errors';
import type { Router, RouterConfig, RouterContext, ToolResult } from './types';

/**
 * Creates an MCP router that handles tools/list and tools/call requests
 */
export function createRouter(config: RouterConfig): Router {
    const { toolDefs, handlers, context: defaultContext = {} } = config;

    // Validate configuration
    for (const toolDef of toolDefs) {
        if (!handlers[toolDef.name]) {
            throw new Error(
                `Missing handler for tool: ${toolDef.name}. Please provide a handler in the handlers object.`,
            );
        }
    }

    return {
        getToolDefinitions() {
            return toolDefs;
        },

        async callTool(
            name: string,
            params: Record<string, unknown>,
            context?: Partial<RouterContext>,
        ): Promise<ToolResult> {
            const handler = handlers[name];
            if (!handler) {
                throw new ToolExecutionError(`Tool not found: ${name}`, name);
            }

            const mergedContext: RouterContext = {
                ...defaultContext,
                ...context,
            };

            try {
                return await handler(params, mergedContext);
            } catch (error) {
                throw new ToolExecutionError(
                    `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
                    name,
                    error,
                );
            }
        },

        async handle(
            message: unknown,
            context?: Partial<RouterContext>,
        ): Promise<unknown> {
            const msg = message as McpMessage;

            if (!msg.method) {
                return {
                    error: normalizeError('Missing method in request'),
                };
            }

            try {
                switch (msg.method) {
                    case 'tools/list':
                        return handleToolsList();
                    case 'tools/call':
                        return await handleToolsCall(msg as McpRequest, context);
                    default:
                        return {
                            error: normalizeError(`Unknown method: ${msg.method}`),
                        };
                }
            } catch (error) {
                return {
                    error: normalizeError(error),
                };
            }
        },
    };

    function handleToolsList(): ToolsListResponse {
        return {
            tools: toolDefs.map(def => ({
                name: def.name,
                description: def.description,
                inputSchema: def.inputSchema,
            })),
        };
    }

    async function handleToolsCall(
        request: McpRequest,
        context?: Partial<RouterContext>,
    ): Promise<ToolsCallResponse> {
        if (request.method !== 'tools/call') {
            throw new Error('Invalid request method');
        }

        const { name, arguments: args = {} } = request.params;

        const handler = handlers[name];
        if (!handler) {
            throw new ToolExecutionError(`Tool not found: ${name}`, name);
        }

        const mergedContext: RouterContext = {
            ...defaultContext,
            ...context,
        };

        try {
            const result = await handler(args, mergedContext);
            return {
                content: result.content,
                isError: result.isError,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error executing tool ${name}: ${errorMessage}`,
                    },
                ],
                isError: true,
            };
        }
    }
}
