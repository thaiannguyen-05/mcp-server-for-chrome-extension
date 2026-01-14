/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { config, validateConfig } from './config.js';
import { AuthManager } from './auth/index.js';
import { McpClientManager } from './mcp/client.js';
import { logger } from './utils/logger.js';
import type {
    Session,
    IncomingMessage,
    AuthMessage,
    BridgeMessage,
    PingMessage,
    AuthSuccessResponse,
    AuthErrorResponse,
    PongMessage,
} from './types/index.js';

export class WebSocketBridgeServer {
    private wss: WebSocketServer | null = null;
    private httpServer: ReturnType<typeof createServer> | null = null;
    private sessions: Map<string, Session> = new Map();
    private authManager: AuthManager;
    private mcpClient: McpClientManager;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Validate configuration
        validateConfig(config);

        this.authManager = new AuthManager(config);
        this.mcpClient = new McpClientManager();
    }

    async start(): Promise<void> {
        // Initialize MCP client
        await this.connectToMcpServer();

        // Create HTTP server for health checks
        const app = express();

        app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                connections: this.sessions.size,
                mcpConnected: this.mcpClient.isConnected(),
                timestamp: new Date().toISOString(),
            });
        });

        this.httpServer = createServer(app);

        // Create WebSocket server
        this.wss = new WebSocketServer({
            server: this.httpServer,
            verifyClient: (info) => {
                // Validate origin
                return this.authManager.validateOrigin(info.origin);
            },
        });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        // Start HTTP server
        this.httpServer.listen(config.port, () => {
            logger.info(
                {
                    port: config.port,
                    apiKeysConfigured: config.apiKeys.length,
                    allowedOrigins: config.allowedOrigins,
                },
                'WebSocket Bridge Server started'
            );
        });

        // Start session cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // Check every minute
    }

    private async connectToMcpServer(): Promise<void> {
        // For now, we'll connect to the main MCP extension lib
        // In a real deployment, this would be configured via environment variables
        const serverCommand = 'npx';
        const serverArgs = ['tsx', '../../src/chrome/index.ts', '--stdio'];

        try {
            await this.mcpClient.connect(serverCommand, serverArgs);
        } catch (error) {
            logger.error({ error }, 'Failed to connect to MCP server. Bridge will start but tool calls will fail.');
            // Continue anyway - we can still accept connections, but tool calls will fail
        }
    }

    private handleConnection(ws: WebSocket, req: express.Request): void {
        const sessionId = uuidv4();

        logger.info({ sessionId, origin: req.headers.origin }, 'New WebSocket connection');

        const session: Session = {
            id: sessionId,
            ws,
            authenticated: false,
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
            requestCount: 0,
            rateLimitResetAt: Date.now() + config.rateLimit.windowMs,
        };

        this.sessions.set(sessionId, session);

        ws.on('message', async (data) => {
            await this.handleMessage(session, data);
        });

        ws.on('close', () => {
            logger.info({ sessionId }, 'WebSocket connection closed');
            this.sessions.delete(sessionId);
        });

        ws.on('error', (error) => {
            logger.error({ sessionId, error }, 'WebSocket error');
        });
    }

    private async handleMessage(session: Session, data: Buffer): Promise<void> {
        session.lastActivityAt = Date.now();

        let message: IncomingMessage;

        try {
            message = JSON.parse(data.toString()) as IncomingMessage;
        } catch (error) {
            this.sendError(session.ws, 'Invalid JSON message');
            return;
        }

        // Handle ping/pong
        if (this.isPingMessage(message)) {
            const response: PongMessage = {
                type: 'pong',
                timestamp: Date.now(),
            };
            this.send(session.ws, response);
            return;
        }

        // Handle authentication
        if (this.isAuthMessage(message)) {
            this.handleAuth(session, message);
            return;
        }

        // All other messages require authentication
        if (!session.authenticated) {
            const response: AuthErrorResponse = {
                type: 'auth_error',
                message: 'Not authenticated. Send auth message first.',
            };
            this.send(session.ws, response);
            session.ws.close(1008, 'Unauthorized');
            return;
        }

        // Check rate limit
        if (!this.authManager.checkRateLimit(session)) {
            this.sendError(session.ws, 'Rate limit exceeded', 429);
            return;
        }

        // Handle MCP tool call
        if (this.isBridgeMessage(message)) {
            await this.handleToolCall(session, message);
        } else {
            this.sendError(session.ws, 'Unknown message type');
        }
    }

    private handleAuth(session: Session, message: AuthMessage): void {
        const isValid = this.authManager.validateApiKey(message.apiKey);

        if (isValid) {
            session.authenticated = true;
            const response: AuthSuccessResponse = {
                type: 'auth_success',
                sessionId: session.id,
                message: 'Authentication successful',
            };
            this.send(session.ws, response);
            logger.info({ sessionId: session.id }, 'Session authenticated');
        } else {
            const response: AuthErrorResponse = {
                type: 'auth_error',
                message: 'Invalid API key',
            };
            this.send(session.ws, response);
            session.ws.close(1008, 'Invalid API key');
        }
    }

    private async handleToolCall(session: Session, message: BridgeMessage): Promise<void> {
        try {
            logger.debug({ sessionId: session.id, method: message.method }, 'Handling tool call');

            const response = await this.mcpClient.callTool(message);
            this.send(session.ws, response);
        } catch (error) {
            logger.error({ sessionId: session.id, error }, 'Tool call failed');

            const errorResponse: BridgeMessage = {
                id: message.id,
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error',
                },
            };
            this.send(session.ws, errorResponse);
        }
    }

    private send(ws: WebSocket, message: unknown): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    private sendError(ws: WebSocket, message: string, code: number = 400): void {
        const response: BridgeMessage = {
            jsonrpc: '2.0',
            error: {
                code,
                message,
            },
        };
        this.send(ws, response);
    }

    private cleanupExpiredSessions(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (this.authManager.isSessionExpired(session)) {
                session.ws.close(1000, 'Session expired');
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info({ cleanedCount }, 'Cleaned up expired sessions');
        }
    }

    private isPingMessage(message: IncomingMessage): message is PingMessage {
        return 'type' in message && message.type === 'ping';
    }

    private isAuthMessage(message: IncomingMessage): message is AuthMessage {
        return 'type' in message && message.type === 'auth';
    }

    private isBridgeMessage(message: IncomingMessage): message is BridgeMessage {
        return 'jsonrpc' in message || 'method' in message;
    }

    async stop(): Promise<void> {
        logger.info('Stopping WebSocket Bridge Server...');

        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Close all WebSocket connections
        for (const session of this.sessions.values()) {
            session.ws.close(1000, 'Server shutting down');
        }
        this.sessions.clear();

        // Close WebSocket server
        if (this.wss) {
            await new Promise<void>((resolve) => {
                this.wss!.close(() => resolve());
            });
        }

        // Close HTTP server
        if (this.httpServer) {
            await new Promise<void>((resolve) => {
                this.httpServer!.close(() => resolve());
            });
        }

        // Disconnect from MCP server
        await this.mcpClient.disconnect();

        logger.info('WebSocket Bridge Server stopped');
    }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new WebSocketBridgeServer();

    server.start().catch((error) => {
        logger.fatal({ error }, 'Failed to start server');
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        logger.info('Received SIGINT signal');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM signal');
        await server.stop();
        process.exit(0);
    });
}
