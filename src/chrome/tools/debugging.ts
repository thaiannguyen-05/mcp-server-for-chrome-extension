/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Debugging Tools Pack
 * Based on chrome-devtools-mcp debugging tools
 */

import type { ToolDefinition, ToolHandlers } from '../../core/types';
import { ok, err } from '../../core/errors';
import * as tabs from '../exec/tabs';
import * as scripting from '../exec/scripting';
import { ToolPack } from './types';

export const debuggingDefinitions: ToolDefinition[] = [
    {
        name: 'screenshot',
        description:
            'Take a screenshot of the visible area of the current tab. Returns the image as base64-encoded data URL.',
        inputSchema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['jpeg', 'png'],
                    description:
                        'Image format. "png" for lossless quality, "jpeg" for smaller file size. Default: png',
                },
                quality: {
                    type: 'number',
                    description:
                        'JPEG quality (0-100). Only applicable when format is "jpeg". Default: 90',
                },
            },
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
    {
        name: 'evaluate_script',
        description:
            'Execute JavaScript code in the context of the current tab and return the result. Useful for extracting data or debugging page state.',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description:
                        'JavaScript code to execute. The code runs in page context and can access the DOM. Use "return" to get values back.',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID. If not provided, uses the current active tab.',
                },
            },
            required: ['code'],
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
];

export const debuggingHandlers: ToolHandlers = {
    async screenshot(params, _context) {
        try {
            const { format = 'png', quality = 90 } = params as {
                format?: 'jpeg' | 'png';
                quality?: number;
            };

            const options: chrome.tabs.CaptureVisibleTabOptions = { format };
            if (format === 'jpeg') {
                options.quality = quality;
            }

            const dataUrl = await tabs.captureScreenshot(options);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Screenshot captured successfully (format: ${format})`,
                    },
                    {
                        type: 'image',
                        data: dataUrl,
                        mimeType: `image/${format}`,
                    },
                ],
            };
        } catch (error) {
            return err(error as Error);
        }
    },

    async evaluate_script(params, _context) {
        try {
            const { code, tabId } = params as { code: string; tabId?: number };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            const result = await scripting.executeScript(targetTabId, code);

            return ok(
                `Script executed successfully.\n\nResult:\n${JSON.stringify(result, null, 2)}`,
            );
        } catch (error) {
            return err(error as Error);
        }
    },
};

export const debuggingTools: ToolPack = {
    definitions: debuggingDefinitions,
    handlers: debuggingHandlers,
};
