/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import dotenv from 'dotenv';
import type { BridgeConfig } from './types/index.js';

// Load environment variables
dotenv.config();

const parseNumberEnv = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    if (!value) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid numeric value for ${key}: ${value}`);
    }
    return parsed;
};

const parseArrayEnv = (key: string, defaultValue: string[]): string[] => {
    const value = process.env[key];
    if (!value) {
        return defaultValue;
    }
    return value.split(',').map(item => item.trim()).filter(Boolean);
};

export const config: BridgeConfig = {
    port: parseNumberEnv('PORT', 8012),
    apiKeys: parseArrayEnv('API_KEYS', ['dev-key-insecure']),
    allowedOrigins: parseArrayEnv('ALLOWED_ORIGINS', ['*']),
    rateLimit: {
        windowMs: parseNumberEnv('RATE_LIMIT_WINDOW_MS', 60000),
        maxRequests: parseNumberEnv('RATE_LIMIT_MAX_REQUESTS', 100),
    },
    session: {
        timeoutMs: parseNumberEnv('SESSION_TIMEOUT_MS', 1800000),
    },
    logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate critical configuration
if (process.env.NODE_ENV === 'production') {
    if (config.apiKeys.includes('dev-key-insecure')) {
        throw new Error('CRITICAL: Cannot use default API key in production. Set API_KEYS environment variable.');
    }
    if (config.allowedOrigins.includes('*')) {
        console.warn('WARNING: Allowed origins set to "*" in production. Consider restricting to specific origins.');
    }
}

export function validateConfig(cfg: BridgeConfig): void {
    if (cfg.port < 1 || cfg.port > 65535) {
        throw new Error(`Invalid port number: ${cfg.port}`);
    }
    if (cfg.apiKeys.length === 0) {
        throw new Error('At least one API key must be configured');
    }
    if (cfg.rateLimit.maxRequests < 1) {
        throw new Error('Rate limit max requests must be at least 1');
    }
}
