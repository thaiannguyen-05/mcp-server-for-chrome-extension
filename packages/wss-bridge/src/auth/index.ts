/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { Session, BridgeConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AuthManager {
    private config: BridgeConfig;

    constructor(config: BridgeConfig) {
        this.config = config;
    }

    validateApiKey(apiKey: string): boolean {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        const isValid = this.config.apiKeys.includes(apiKey);

        if (!isValid) {
            logger.warn({ apiKey: apiKey.substring(0, 8) + '...' }, 'Invalid API key attempt');
        }

        return isValid;
    }

    validateOrigin(origin: string | undefined): boolean {
        // If no origin provided, reject
        if (!origin) {
            logger.warn('Connection attempt without origin header');
            return false;
        }

        // If wildcard is allowed, accept all
        if (this.config.allowedOrigins.includes('*')) {
            return true;
        }

        // Check if origin is in allowed list
        const isAllowed = this.config.allowedOrigins.includes(origin);

        if (!isAllowed) {
            logger.warn({ origin }, 'Connection attempt from disallowed origin');
        }

        return isAllowed;
    }

    checkRateLimit(session: Session): boolean {
        const now = Date.now();

        // Reset rate limit window if expired
        if (now > session.rateLimitResetAt) {
            session.requestCount = 0;
            session.rateLimitResetAt = now + this.config.rateLimit.windowMs;
        }

        // Increment request count
        session.requestCount++;

        // Check if exceeded
        const exceeded = session.requestCount > this.config.rateLimit.maxRequests;

        if (exceeded) {
            logger.warn(
                {
                    sessionId: session.id,
                    requestCount: session.requestCount,
                    maxRequests: this.config.rateLimit.maxRequests
                },
                'Rate limit exceeded'
            );
        }

        return !exceeded;
    }

    isSessionExpired(session: Session): boolean {
        const now = Date.now();
        const idleTime = now - session.lastActivityAt;
        const expired = idleTime > this.config.session.timeoutMs;

        if (expired) {
            logger.info(
                { sessionId: session.id, idleTime },
                'Session expired due to inactivity'
            );
        }

        return expired;
    }
}
