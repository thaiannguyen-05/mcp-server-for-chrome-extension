/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
    level: config.logLevel,
    transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    formatters: {
        level: (label) => ({ level: label }),
    },
});
