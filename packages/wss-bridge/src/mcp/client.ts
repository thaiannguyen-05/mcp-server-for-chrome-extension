/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { BridgeMessage } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class McpClientManager {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private connected: boolean = false;

    async connect(serverCommand: string, serverArgs: string[]): Promise<void> {
        if (this.connected) {
            logger.debug('MCP client already connected');
            return;
        }

        try {
            this.transport = new StdioClientTransport({
                command: serverCommand,
                args: serverArgs,
            });

            this.client = new Client(
                {
                    name: 'websocket-bridge',
                    version: '0.1.0',
                },
                {
                    capabilities: {},
                }
            );

            await this.client.connect(this.transport);
            this.connected = true;

            logger.info({ command: serverCommand, args: serverArgs }, 'Connected to MCP server');
        } catch (error) {
            logger.error({ error }, 'Failed to connect to MCP server');
            throw error;
        }
    }

    async callTool(message: BridgeMessage): Promise<BridgeMessage> {
        if (!this.client || !this.connected) {
            throw new Error('MCP client not connected');
        }

        if (!message.method || message.method !== 'tools/call') {
            throw new Error(`Unsupported method: ${message.method}`);
        }

        const params = message.params as { name: string; arguments?: Record<string, unknown> };
        if (!params || !params.name) {
            throw new Error('Missing tool name in parameters');
        }

        try {
            logger.debug({ tool: params.name, arguments: params.arguments }, 'Calling MCP tool');

            const result = await this.client.callTool({
                name: params.name,
                arguments: params.arguments || {},
            });

            logger.debug({ tool: params.name, result }, 'MCP tool call successful');

            return {
                id: message.id,
                jsonrpc: '2.0',
                result,
            };
        } catch (error) {
            logger.error({ error, tool: params.name }, 'MCP tool call failed');

            return {
                id: message.id,
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Tool execution failed',
                    data: { tool: params.name },
                },
            };
        }
    }

    async listTools(): Promise<BridgeMessage> {
        if (!this.client || !this.connected) {
            throw new Error('MCP client not connected');
        }

        try {
            const result = await this.client.listTools();

            logger.debug({ toolCount: result.tools.length }, 'Listed MCP tools');

            return {
                jsonrpc: '2.0',
                result: { tools: result.tools },
            };
        } catch (error) {
            logger.error({ error }, 'Failed to list MCP tools');

            return {
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Failed to list tools',
                },
            };
        }
    }

    async disconnect(): Promise<void> {
        if (this.client && this.connected) {
            try {
                await this.client.close();
                this.connected = false;
                logger.info('Disconnected from MCP server');
            } catch (error) {
                logger.error({ error }, 'Error disconnecting from MCP server');
            }
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}
