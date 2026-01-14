/**
 * Example tool handlers for browser control
 */

import type { ToolHandlers } from '../../../src/core/types';
import { ok, err } from '../../../src/core/errors';
import * as tabs from '../../../src/chrome/exec/tabs';
import * as scripting from '../../../src/chrome/exec/scripting';

export const handlers: ToolHandlers = {
    async navigate(params, context) {
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

    async click(params, context) {
        try {
            const { selector } = params as { selector: string };
            const tab = await tabs.getCurrentTab();

            if (!tab.id) {
                return err('No active tab found');
            }

            await scripting.clickElement(tab.id, selector);

            return ok(`Clicked element: ${selector}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async fill(params, context) {
        try {
            const { selector, value } = params as { selector: string; value: string };
            const tab = await tabs.getCurrentTab();

            if (!tab.id) {
                return err('No active tab found');
            }

            await scripting.fillInput(tab.id, selector, value);

            return ok(`Filled ${selector} with: ${value}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async screenshot(params, context) {
        try {
            const { format = 'png' } = params as { format?: 'jpeg' | 'png' };
            const dataUrl = await tabs.captureScreenshot({ format });

            return {
                content: [
                    {
                        type: 'text',
                        text: 'Screenshot captured successfully',
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

    async evaluate(params, context) {
        try {
            const { code } = params as { code: string };
            const tab = await tabs.getCurrentTab();

            if (!tab.id) {
                return err('No active tab found');
            }

            const result = await scripting.executeScript(tab.id, code);

            return ok(`Result: ${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            return err(error as Error);
        }
    },

    async get_tabs(params, context) {
        try {
            const allTabs = await tabs.getAllTabs();

            const tabList = allTabs.map((tab, idx) =>
                `${idx + 1}. ${tab.title} - ${tab.url} ${tab.active ? '[ACTIVE]' : ''}`
            ).join('\n');

            return ok(`Open tabs (${allTabs.length}):\n${tabList}`);
        } catch (error) {
            return err(error as Error);
        }
    },
};
