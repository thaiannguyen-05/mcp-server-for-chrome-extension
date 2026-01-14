/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { Router } from '../../core/types';

/**
 * Chrome Runtime Port Transport
 * Handles MCP communication via chrome.runtime messaging
 */

export interface RuntimePortTransportConfig {
    portName?: string;
    router: Router;
    onError?: (error: Error) => void;
}

export class RuntimePortTransport {
    private router: Router;
    private portName: string;
    private onError: (error: Error) => void;
    private ports: Set<chrome.runtime.Port> = new Set();

    constructor(config: RuntimePortTransportConfig) {
        this.router = config.router;
        this.portName = config.portName || 'mcp-extension';
        this.onError = config.onError || console.error;
    }

    /**
     * Start listening for connections (call in service worker)
     */
    listen(): void {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.portName) {
                this.handleConnection(port);
            }
        });
    }

    /**
     * Connect to service worker (call from popup/content script)
     */
    connect(): chrome.runtime.Port {
        const port = chrome.runtime.connect({ name: this.portName });
        this.setupPortListeners(port);
        return port;
    }

    private handleConnection(port: chrome.runtime.Port): void {
        this.ports.add(port);
        this.setupPortListeners(port);

        port.onDisconnect.addListener(() => {
            this.ports.delete(port);
        });
    }

    private setupPortListeners(port: chrome.runtime.Port): void {
        port.onMessage.addListener(async message => {
            try {
                const response = await this.router.handle(message);
                port.postMessage(response);
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.onError(err);
                port.postMessage({
                    error: {
                        code: -1,
                        message: err.message,
                    },
                });
            }
        });

        port.onDisconnect.addListener(() => {
            // Port disconnected
        });
    }

    /**
     * Send message to connected port
     */
    async sendMessage(
        port: chrome.runtime.Port,
        message: unknown,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const listener = (response: unknown) => {
                port.onMessage.removeListener(listener);
                resolve(response);
            };

            port.onMessage.addListener(listener);
            port.postMessage(message);

            // Timeout after 30 seconds
            setTimeout(() => {
                port.onMessage.removeListener(listener);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    /**
     * Broadcast message to all connected ports
     */
    broadcast(message: unknown): void {
        for (const port of this.ports) {
            try {
                port.postMessage(message);
            } catch (error) {
                console.error('Error broadcasting message:', error);
            }
        }
    }

    /**
     * Disconnect all ports
     */
    disconnect(): void {
        for (const port of this.ports) {
            port.disconnect();
        }
        this.ports.clear();
    }
}
