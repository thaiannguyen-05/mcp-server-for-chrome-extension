/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

export interface WebSocketTransportConfig {
    serverUrl: string;
    apiKey?: string;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    onError?: (error: Error) => void;
    onStateChange?: (state: ConnectionState) => void;
}

export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';
