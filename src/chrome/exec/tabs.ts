/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Chrome Tabs API Helpers
 * Wrappers for common chrome.tabs operations
 */

export interface TabInfo {
    id: number;
    url: string;
    title: string;
    active: boolean;
    windowId: number;
}

/**
 * Get all tabs
 */
export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
    return chrome.tabs.query({});
}

/**
 * Get currently active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error('No active tab found');
    }
    return tabs[0];
}

/**
 * Get tab by ID
 */
export async function getTabById(tabId: number): Promise<chrome.tabs.Tab> {
    return chrome.tabs.get(tabId);
}

/**
 * Create new tab
 */
export async function createTab(
    url: string,
    options?: {
        active?: boolean;
        windowId?: number;
    },
): Promise<chrome.tabs.Tab> {
    return chrome.tabs.create({
        url,
        active: options?.active ?? true,
        windowId: options?.windowId,
    });
}

/**
 * Update tab
 */
export async function updateTab(
    tabId: number,
    updateProperties: chrome.tabs.UpdateProperties,
): Promise<chrome.tabs.Tab> {
    return chrome.tabs.update(tabId, updateProperties);
}

/**
 * Navigate tab to URL
 */
export async function navigateTab(
    tabId: number,
    url: string,
): Promise<chrome.tabs.Tab> {
    return chrome.tabs.update(tabId, { url });
}

/**
 * Close tab
 */
export async function closeTab(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
}

/**
 * Reload tab
 */
export async function reloadTab(
    tabId: number,
    bypassCache = false,
): Promise<void> {
    await chrome.tabs.reload(tabId, { bypassCache });
}

/**
 * Activate tab
 */
export async function activateTab(tabId: number): Promise<chrome.tabs.Tab> {
    return chrome.tabs.update(tabId, { active: true });
}

/**
 * Capture screenshot of visible tab
 */
export async function captureScreenshot(
    options?: chrome.tabs.CaptureVisibleTabOptions,
): Promise<string> {
    if (options) {
        return chrome.tabs.captureVisibleTab(options);
    }
    return chrome.tabs.captureVisibleTab();
}

/**
 * Query tabs by criteria
 */
export async function queryTabs(
    queryInfo: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab[]> {
    return chrome.tabs.query(queryInfo);
}
