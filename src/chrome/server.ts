/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { Router, RouterContext } from '../core/types';
import { RuntimePortTransport } from './transport/runtimePort';
import * as tabs from './exec/tabs';
import * as scripting from './exec/scripting';
import * as storage from './exec/storage';

/**
 * MCP Extension Server
 * Wire router + transport together for Chrome Extension
 */

export interface McpExtensionServerConfig {
    router: Router;
    transport?: {
        type: 'runtimePort';
        portName?: string;
    };
    context?: Partial<RouterContext>;
    onError?: (error: Error) => void;
}

export class McpExtensionServer {
    private router: Router;
    private transport: RuntimePortTransport;
    private context: Partial<RouterContext>;

    constructor(config: McpExtensionServerConfig) {
        this.router = config.router;
        this.context = config.context || {};

        // Initialize transport
        const transportType = config.transport?.type || 'runtimePort';
        if (transportType === 'runtimePort') {
            this.transport = new RuntimePortTransport({
                router: this.router,
                portName: config.transport?.portName,
                onError: config.onError,
            });
        } else {
            throw new Error(`Unknown transport type: ${transportType}`);
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
        this.transport.listen();
    }

    /**
     * Connect to service worker (call from popup/content script)
     */
    connect(): chrome.runtime.Port {
        return this.transport.connect();
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
    getTransport(): RuntimePortTransport {
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
