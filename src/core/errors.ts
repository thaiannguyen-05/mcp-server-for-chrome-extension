/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import type { ContentItem, McpError } from './protocol';
import type { ToolResult } from './types';

/**
 * Error handling utilities
 */

export function ok(message: string, additionalContent?: ContentItem[]): ToolResult {
    return {
        content: [
            {
                type: 'text',
                text: message,
            },
            ...(additionalContent || []),
        ],
        isError: false,
    };
}

export function err(error: Error | string, _code = -1): ToolResult {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    let text = message;
    if (stack) {
        text += `\n\nStack trace:\n${stack}`;
    }

    return {
        content: [
            {
                type: 'text',
                text,
            },
        ],
        isError: true,
        // Include error code in metadata if needed later
        // _code: code
    };
}

export function normalizeError(error: unknown): McpError {
    if (error instanceof Error) {
        // Handle 'cause' safely for older TS lib settings
        const cause = 'cause' in error ? (error as any).cause : undefined;

        return {
            code: -1,
            message: error.message,
            data: {
                stack: error.stack,
                cause,
            },
        };
    }

    if (typeof error === 'string') {
        return {
            code: -1,
            message: error,
        };
    }

    return {
        code: -1,
        message: 'Unknown error occurred',
        data: error,
    };
}

export class ToolExecutionError extends Error {
    constructor(
        message: string,
        public readonly toolName: string,
        public readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'ToolExecutionError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public readonly field?: string,
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
