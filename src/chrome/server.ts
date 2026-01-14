/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { Router, RouterContext } from '../core/types';
import { RuntimePortTransport } from './transport/runtimePort';
import { WebSocketTransport } from './transport/wsClient';
import type { ConnectionState } from './transport/types';
import * as tabs from './exec/tabs';
import * as scripting from './exec/scripting';
import * as storage from './exec/storage';

/**
 * MCP Extension Server
 * Wire router + transport together for Chrome Extension
 */

export interface McpExtensionServerConfig {
    router: Router;
    transport?:
    | {
        type: 'runtimePort';
        portName?: string;
    }
    | {
        type: 'websocket';
        serverUrl: string;
        apiKey?: string;
        reconnect?: boolean;
        maxReconnectAttempts?: number;
        onStateChange?: (state: ConnectionState) => void;
    };
    context?: Partial<RouterContext>;
    onError?: (error: Error) => void;
}

export class McpExtensionServer {
    private router: Router;
    private transport: RuntimePortTransport | WebSocketTransport;
    private context: Partial<RouterContext>;

    constructor(config: McpExtensionServerConfig) {
        this.router = config.router;
        this.context = config.context || {};

        // Initialize transport
        const transportConfig = config.transport || { type: 'runtimePort' };

        if (transportConfig.type === 'websocket') {
            this.transport = new WebSocketTransport({
                serverUrl: transportConfig.serverUrl,
                apiKey: transportConfig.apiKey,
                reconnect: transportConfig.reconnect,
                maxReconnectAttempts: transportConfig.maxReconnectAttempts,
                onError: config.onError,
                onStateChange: transportConfig.onStateChange,
            });
        } else {
            this.transport = new RuntimePortTransport({
                router: this.router,
                portName: transportConfig.portName,
                onError: config.onError,
            });
        }

        // Enhance context with Chrome helpers
        this.enhanceContext();
    }

    private enhanceContext(): void {
        this.context = {
            ...this.context,
            // Tab helpers
            getCurrentTab: tabs.getCurrentTab,
            getAllTabs: tabs.getAllTabs,
            captureScreenshot: tabs.captureScreenshot,

            // Script execution
            executeScript: async <T>(code: string) => {
                const tab = await tabs.getCurrentTab();
                if (!tab.id) {
                    throw new Error('No active tab ID');
                }
                return scripting.executeScript<T>(tab.id, code);
            },

            // Storage helpers
            getStorage: storage.getStorage,
            setStorage: storage.setStorage,
        };
    }

    /**
     * Start listening for connections (call in service worker)
     */
    listen(): void {
        if (this.transport instanceof RuntimePortTransport) {
            this.transport.listen();
        } else if (this.transport instanceof WebSocketTransport) {
            // For WebSocket transport, connect to server
            this.transport.connect().catch((error) => {
                console.error('Failed to connect to WebSocket server:', error);
            });
        }
    }

    /**
     * Connect to service worker (call from popup/content script)
     * Only works with RuntimePort transport
     */
    connect(): chrome.runtime.Port | null {
        if (this.transport instanceof RuntimePortTransport) {
            return this.transport.connect();
        }
        console.warn('connect() is only supported for RuntimePort transport');
        return null;
    }

    /**
     * Get enhanced router context
     */
    getContext(): Partial<RouterContext> {
        return this.context;
    }

    /**
     * Get router instance
     */
    getRouter(): Router {
        return this.router;
    }

    /**
     * Get transport instance
     */
    getTransport(): RuntimePortTransport | WebSocketTransport {
        return this.transport;
    }
}

/**
 * Factory function to create MCP Extension Server
 */
export function createMcpExtensionServer(
    config: McpExtensionServerConfig,
): McpExtensionServer {
    return new McpExtensionServer(config);
}
