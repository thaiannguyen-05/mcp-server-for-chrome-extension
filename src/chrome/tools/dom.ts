/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * DOM Interaction Tools Pack
 * Based on chrome-devtools-mcp input automation tools
 */

import type { ToolDefinition, ToolHandlers } from '../../core/types';
import { ok, err } from '../../core/errors';
import * as tabs from '../exec/tabs';
import * as scripting from '../exec/scripting';
import { ToolPack } from './types';

export const domDefinitions: ToolDefinition[] = [
    {
        name: 'dom.click',
        description: 'Click an element on the page using a CSS selector.',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description:
                        'CSS selector for the element to click (e.g., "#submit-button", ".login-btn")',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID. If not provided, uses the current active tab.',
                },
            },
            required: ['selector'],
        },
        annotations: {
            category: 'input',
            readOnlyHint: false,
        },
    },
    {
        name: 'dom.fill',
        description:
            'Fill an input field, textarea, or select element with a value.',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description:
                        'CSS selector for the input element (e.g., "#email", "input[name=password]")',
                },
                value: {
                    type: 'string',
                    description: 'The text to fill into the input field',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID. If not provided, uses the current active tab.',
                },
            },
            required: ['selector', 'value'],
        },
        annotations: {
            category: 'input',
            readOnlyHint: false,
        },
    },
    {
        name: 'dom.getText',
        description: 'Get the text content of an element using a CSS selector.',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector for the element',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID. If not provided, uses the current active tab.',
                },
            },
            required: ['selector'],
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
    {
        name: 'dom.waitForSelector',
        description:
            'Wait for an element to appear in the DOM. Useful for dynamic content.',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector to wait for',
                },
                timeout: {
                    type: 'number',
                    description:
                        'Maximum wait time in milliseconds. Default: 5000ms (5 seconds)',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID. If not provided, uses the current active tab.',
                },
            },
            required: ['selector'],
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
];

export const domHandlers: ToolHandlers = {
    async 'dom.click'(params, _context) {
        try {
            const { selector, tabId } = params as {
                selector: string;
                tabId?: number;
            };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            await scripting.clickElement(targetTabId, selector);

            return ok(`Clicked element: ${selector}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async 'dom.fill'(params, _context) {
        try {
            const { selector, value, tabId } = params as {
                selector: string;
                value: string;
                tabId?: number;
            };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            await scripting.fillInput(targetTabId, selector, value);

            return ok(`Filled ${selector} with: ${value}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async 'dom.getText'(params, _context) {
        try {
            const { selector, tabId } = params as {
                selector: string;
                tabId?: number;
            };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            const text = await scripting.getElementText(targetTabId, selector);

            return ok(`Text content of ${selector}:\n${text}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async 'dom.waitForSelector'(params, _context) {
        try {
            const { selector, timeout = 5000, tabId } = params as {
                selector: string;
                timeout?: number;
                tabId?: number;
            };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            await scripting.waitForSelector(targetTabId, selector, timeout);

            return ok(`Element ${selector} appeared in DOM`);
        } catch (error) {
            return err(error as Error);
        }
    },
};

export const domTools: ToolPack = {
    definitions: domDefinitions,
    handlers: domHandlers,
};
