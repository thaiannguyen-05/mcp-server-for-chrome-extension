/**
 * Example tool definitions for browser control
 */

import type { ToolDefinition } from '../../../src/core/types';

export const toolDefs: ToolDefinition[] = [
    {
        name: 'navigate',
        description: 'Navigate the current tab to a URL',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'The URL to navigate to',
                },
            },
            required: ['url'],
        },
        annotations: {
            category: 'navigation',
            readOnlyHint: false,
        },
    },
    {
        name: 'click',
        description: 'Click an element by CSS selector',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector for the element to click',
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
        name: 'fill',
        description: 'Fill an input field with text',
        inputSchema: {
            type: 'object',
            properties: {
                selector: {
                    type: 'string',
                    description: 'CSS selector for the input element',
                },
                value: {
                    type: 'string',
                    description: 'The text to fill',
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
        name: 'screenshot',
        description: 'Take a screenshot of the current tab',
        inputSchema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['jpeg', 'png'],
                    description: 'Image format',
                },
            },
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
    {
        name: 'evaluate',
        description: 'Execute JavaScript in the current tab',
        inputSchema: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'JavaScript code to execute',
                },
            },
            required: ['code'],
        },
        annotations: {
            category: 'debugging',
            readOnlyHint: true,
        },
    },
    {
        name: 'get_tabs',
        description: 'Get list of all open tabs',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        annotations: {
            category: 'navigation',
            readOnlyHint: true,
        },
    },
];
