/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Navigation Tools Pack
 * Based on chrome-devtools-mcp page navigation tools
 */

import type { ToolDefinition, ToolHandlers } from '../../core/types';
import { ok, err } from '../../core/errors';
import * as tabs from '../exec/tabs';
import { ToolPack } from './types';

export const navigationDefinitions: ToolDefinition[] = [
    {
        name: 'navigate',
        description: 'Navigates the currently selected tab to a URL.',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'Target URL to navigate to',
                },
                waitUntil: {
                    type: 'string',
                    enum: ['load', 'domcontentloaded'],
                    description:
                        'Wait until specific event. "load" waits for full page load, "domcontentloaded" waits for DOM to be ready.',
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
        name: 'new_page',
        description: 'Creates a new tab and navigates to the specified URL.',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'URL to load in the new tab',
                },
                active: {
                    type: 'boolean',
                    description: 'Whether to activate the new tab. Default: true',
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
        name: 'close_page',
        description:
            'Closes a tab by its ID. The last open tab cannot be closed.',
        inputSchema: {
            type: 'object',
            properties: {
                tabId: {
                    type: 'number',
                    description: 'The ID of the tab to close',
                },
            },
            required: ['tabId'],
        },
        annotations: {
            category: 'navigation',
            readOnlyHint: false,
        },
    },
    {
        name: 'list_pages',
        description: 'Get a list of all open tabs in the browser.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        annotations: {
            category: 'navigation',
            readOnlyHint: true,
        },
    },
    {
        name: 'reload_page',
        description: 'Reloads the current tab.',
        inputSchema: {
            type: 'object',
            properties: {
                tabId: {
                    type: 'number',
                    description: 'The ID of the tab to reload. If not provided, reloads current tab.',
                },
                bypassCache: {
                    type: 'boolean',
                    description: 'Whether to bypass the cache when reloading. Default: false',
                },
            },
        },
        annotations: {
            category: 'navigation',
            readOnlyHint: false,
        },
    },
];

export const navigationHandlers: ToolHandlers = {
    async navigate(params, _context) {
        try {
            const { url } = params as { url: string };
            const tab = await tabs.getCurrentTab();

            if (!tab.id) {
                return err('No active tab found');
            }

            await tabs.navigateTab(tab.id, url);

            return ok(`Navigated to ${url}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async new_page(params, _context) {
        try {
            const { url, active = true } = params as { url: string; active?: boolean };

            const newTab = await tabs.createTab(url, { active });

            return ok(
                `Created new tab (ID: ${newTab.id}) and navigated to ${url}`,
            );
        } catch (error) {
            return err(error as Error);
        }
    },

    async close_page(params, _context) {
        try {
            const { tabId } = params as { tabId: number };

            const allTabs = await tabs.getAllTabs();
            if (allTabs.length === 1) {
                return err(
                    'The last open tab cannot be closed. It is fine to keep it open.',
                );
            }

            await tabs.closeTab(tabId);

            return ok(`Closed tab ${tabId}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async list_pages(_params, _context) {
        try {
            const allTabs = await tabs.getAllTabs();

            const tabList = allTabs
                .map(
                    (tab, _idx) =>
                        `${tab.id}: ${tab.title} - ${tab.url} ${tab.active ? '[ACTIVE]' : ''}`,
                )
                .join('\n');

            return ok(`Open tabs (${allTabs.length}):\n${tabList}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async reload_page(params, _context) {
        try {
            const { tabId, bypassCache = false } = params as {
                tabId?: number;
                bypassCache?: boolean;
            };

            const targetTabId = tabId || (await tabs.getCurrentTab()).id;
            if (!targetTabId) {
                return err('No tab ID provided or active tab found');
            }

            await tabs.reloadTab(targetTabId, bypassCache);

            return ok(
                `Reloaded tab ${targetTabId}${bypassCache ? ' (bypassed cache)' : ''}`,
            );
        } catch (error) {
            return err(error as Error);
        }
    },
};

export const navigationTools: ToolPack = {
    definitions: navigationDefinitions,
    handlers: navigationHandlers,
};
