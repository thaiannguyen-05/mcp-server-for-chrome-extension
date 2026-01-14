/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { McpRequest, McpResponse } from '../../core/protocol.js';
import type { WebSocketTransportConfig, ConnectionState } from './types.js';

/**
 * WebSocket Transport for MCP Extension
 * Connects extension to WebSocket Bridge Server
 */

export interface WebSocketMessage {
    id?: string;
    jsonrpc?: '2.0';
    method?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
    type?: string;
}

export class WebSocketTransport {
    private ws: WebSocket | null = null;
    private serverUrl: string;
    private apiKey: string | undefined;
    private reconnectEnabled: boolean;
    private maxReconnectAttempts: number;
    private reconnectAttempts: number = 0;
    private reconnectDelay: number = 1000;
    private state: ConnectionState = 'disconnected';
    private pendingRequests: Map<
        string,
        {
            resolve: (value: McpResponse) => void;
            reject: (error: Error) => void;
        }
    > = new Map();
    private onError: ((error: Error) => void) | undefined;
    private onStateChange: ((state: ConnectionState) => void) | undefined;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private authenticated: boolean = false;

    constructor(config: WebSocketTransportConfig) {
        this.serverUrl = config.serverUrl;
        this.apiKey = config.apiKey;
        this.reconnectEnabled = config.reconnect !== false;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
        this.onError = config.onError;
        this.onStateChange = config.onStateChange;
    }

    /**
     * Connect to WebSocket server
     */
    async connect(): Promise<void> {
        if (this.state === 'connected' || this.state === 'connecting') {
            return;
        }

        this.updateState('connecting');

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.serverUrl);

                this.ws.onopen = () => {
                    console.log('[WS Transport] Connection opened');
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;

                    // Authenticate if API key is provided
                    if (this.apiKey) {
                        this.authenticate()
                            .then(() => resolve())
                            .catch((error) => reject(error));
                    } else {
                        this.authenticated = true;
                        this.updateState('connected');
                        this.startHeartbeat();
                        resolve();
                    }
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = () => {
                    const error = new Error('WebSocket error');
                    console.error('[WS Transport] Error:', error);
                    this.handleError(error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[WS Transport] Connection closed');
                    this.handleClose();
                };
            } catch (error) {
                const err =
                    error instanceof Error
                        ? error
                        : new Error('Failed to create WebSocket');
                this.handleError(err);
                reject(err);
            }
        });
    }

    /**
     * Authenticate with the bridge server
     */
    private async authenticate(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.apiKey) {
                reject(new Error('No API key provided'));
                return;
            }

            const authHandler = (event: MessageEvent) => {
                const message = JSON.parse(event.data as string) as WebSocketMessage;

                if (message.type === 'auth_success') {
                    console.log('[WS Transport] Authentication successful');
                    this.authenticated = true;
                    this.updateState('connected');
                    this.startHeartbeat();
                    this.ws?.removeEventListener('message', authHandler);
                    resolve();
                } else if (message.type === 'auth_error') {
                    console.error('[WS Transport] Authentication failed');
                    this.ws?.removeEventListener('message', authHandler);
                    reject(new Error('Authentication failed: ' + message.error?.message));
                }
            };

            this.ws?.addEventListener('message', authHandler);

            // Send authentication message
            this.send({
                type: 'auth',
                apiKey: this.apiKey,
            });
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        this.reconnectEnabled = false;
        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        // Reject all pending requests
        for (const [_id, pending] of this.pendingRequests) {
            pending.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();

        this.authenticated = false;
        this.updateState('disconnected');
    }

    /**
     * Send message to WebSocket server
     */
    async sendMessage(message: McpRequest): Promise<McpResponse> {
        if (!this.authenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Not connected to WebSocket server');
        }

        const id = this.generateId();
        const requestMessage = {
            id,
            jsonrpc: '2.0' as const,
            ...message,
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            this.send(requestMessage);

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(data: string): void {
        try {
            const message = JSON.parse(data) as WebSocketMessage;

            // Handle pong messages
            if (message.type === 'pong') {
                return;
            }

            // Handle responses to pending requests
            if (message.id && this.pendingRequests.has(message.id)) {
                const pending = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);

                if (message.error) {
                    pending?.reject(new Error(message.error.message));
                } else {
                    pending?.resolve(message as McpResponse);
                }
            }
        } catch (error) {
            console.error('[WS Transport] Failed to parse message:', error);
        }
    }

    /**
     * Handle connection close
     */
    private handleClose(): void {
        this.stopHeartbeat();
        this.authenticated = false;

        if (this.reconnectEnabled && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.updateState('reconnecting');
            this.reconnect();
        } else {
            this.updateState('disconnected');
        }
    }

    /**
     * Reconnect with exponential backoff
     */
    private reconnect(): void {
        this.reconnectAttempts++;

        console.log(
            `[WS Transport] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );

        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('[WS Transport] Reconnection failed:', error);
                this.handleError(error as Error);
            });

            // Exponential backoff
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        }, this.reconnectDelay);
    }

    /**
     * Start heartbeat ping/pong
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping' });
            }
        }, 30000); // Send ping every 30 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Send raw message to WebSocket
     */
    private send(message: unknown): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Handle errors
     */
    private handleError(error: Error): void {
        this.updateState('error');
        if (this.onError) {
            this.onError(error);
        }
    }

    /**
     * Update connection state
     */
    private updateState(newState: ConnectionState): void {
        if (this.state !== newState) {
            this.state = newState;
            console.log(`[WS Transport] State changed to: ${newState}`);
            if (this.onStateChange) {
                this.onStateChange(newState);
            }
        }
    }

    /**
     * Generate unique request ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Get current connection state
     */
    getState(): ConnectionState {
        return this.state;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.state === 'connected' && this.authenticated;
    }
}
