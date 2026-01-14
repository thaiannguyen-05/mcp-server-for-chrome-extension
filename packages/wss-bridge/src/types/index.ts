/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * WebSocket Bridge Server Types
 */

import type { WebSocket } from 'ws';

export interface BridgeConfig {
    port: number;
    apiKeys: string[];
    allowedOrigins: string[];
    rateLimit: RateLimitConfig;
    session: SessionConfig;
    logLevel: string;
}

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

export interface SessionConfig {
    timeoutMs: number;
}

export interface Session {
    id: string;
    ws: WebSocket;
    authenticated: boolean;
    createdAt: number;
    lastActivityAt: number;
    requestCount: number;
    rateLimitResetAt: number;
}

export interface BridgeMessage {
    id?: string;
    jsonrpc?: '2.0';
    method?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    error?: ErrorResponse;
}

export interface AuthMessage {
    type: 'auth';
    apiKey: string;
}

export interface AuthSuccessResponse {
    type: 'auth_success';
    sessionId: string;
    message: string;
}

export interface AuthErrorResponse {
    type: 'auth_error';
    message: string;
}

export interface ErrorResponse {
    code: number;
    message: string;
    data?: unknown;
}

export interface PingMessage {
    type: 'ping';
}

export interface PongMessage {
    type: 'pong';
    timestamp: number;
}

export type IncomingMessage = AuthMessage | BridgeMessage | PingMessage;
export type OutgoingMessage = AuthSuccessResponse | AuthErrorResponse | BridgeMessage | PongMessage;
