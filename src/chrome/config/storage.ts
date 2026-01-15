/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Chrome Storage Configuration Helpers
 * Utilities for managing WebSocket configuration in chrome.storage
 */

export interface WebSocketConfig {
    serverUrl: string;
    apiKey: string;
}

export interface StorageConfigOptions {
    defaultUrl?: string;
    defaultApiKey?: string;
    storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'mcp_websocket_config';

/**
 * Load WebSocket configuration from chrome.storage.sync
 * 
 * @param options - Configuration options with defaults
 * @returns Promise resolving to WebSocket config
 * 
 * @example
 * ```typescript
 * const config = await loadWebSocketConfig({
 *   defaultUrl: 'ws://localhost:8012',
 *   defaultApiKey: 'demo-key'
 * });
 * ```
 */
export async function loadWebSocketConfig(
    options: StorageConfigOptions = {}
): Promise<WebSocketConfig> {
    const {
        defaultUrl = 'ws://localhost:8012',
        defaultApiKey = '',
        storageKey = DEFAULT_STORAGE_KEY,
    } = options;

    try {
        const result = await chrome.storage.sync.get(storageKey);
        const saved = result[storageKey] as Partial<WebSocketConfig> | undefined;

        return {
            serverUrl: saved?.serverUrl || defaultUrl,
            apiKey: saved?.apiKey || defaultApiKey,
        };
    } catch (error) {
        console.error('[MCP Config] Failed to load config from storage:', error);
        return {
            serverUrl: defaultUrl,
            apiKey: defaultApiKey,
        };
    }
}

/**
 * Save WebSocket configuration to chrome.storage.sync
 * 
 * @param config - WebSocket configuration to save
 * @param storageKey - Optional custom storage key
 * @returns Promise resolving when saved
 * 
 * @example
 * ```typescript
 * await saveWebSocketConfig({
 *   serverUrl: 'wss://my-bridge.example.com',
 *   apiKey: 'my-secret-key'
 * });
 * ```
 */
export async function saveWebSocketConfig(
    config: WebSocketConfig,
    storageKey: string = DEFAULT_STORAGE_KEY
): Promise<void> {
    try {
        await chrome.storage.sync.set({
            [storageKey]: config,
        });
        console.log('[MCP Config] Configuration saved successfully');
    } catch (error) {
        console.error('[MCP Config] Failed to save config to storage:', error);
        throw error;
    }
}

/**
 * Clear WebSocket configuration from chrome.storage.sync
 * 
 * @param storageKey - Optional custom storage key
 * @returns Promise resolving when cleared
 */
export async function clearWebSocketConfig(
    storageKey: string = DEFAULT_STORAGE_KEY
): Promise<void> {
    try {
        await chrome.storage.sync.remove(storageKey);
        console.log('[MCP Config] Configuration cleared');
    } catch (error) {
        console.error('[MCP Config] Failed to clear config from storage:', error);
        throw error;
    }
}

/**
 * Validate WebSocket URL format
 * 
 * @param url - URL to validate
 * @returns Error message if invalid, null if valid
 */
export function validateWebSocketUrl(url: string): string | null {
    if (!url || url.trim() === '') {
        return 'URL cannot be empty';
    }

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
            return 'URL must use ws:// or wss:// protocol';
        }
        return null;
    } catch {
        return 'Invalid URL format';
    }
}

/**
 * Listen for configuration changes
 * 
 * @param callback - Function to call when config changes
 * @param storageKey - Optional custom storage key
 * @returns Cleanup function to stop listening
 * 
 * @example
 * ```typescript
 * const stopListening = onConfigChange((newConfig) => {
 *   console.log('Config updated:', newConfig);
 *   // Reconnect with new config
 * });
 * 
 * // Later: stopListening();
 * ```
 */
export function onConfigChange(
    callback: (config: WebSocketConfig) => void,
    storageKey: string = DEFAULT_STORAGE_KEY
): () => void {
    const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
    ) => {
        if (areaName === 'sync' && changes[storageKey]) {
            const newValue = changes[storageKey].newValue as WebSocketConfig;
            if (newValue) {
                callback(newValue);
            }
        }
    };

    chrome.storage.onChanged.addListener(listener);

    // Return cleanup function
    return () => {
        chrome.storage.onChanged.removeListener(listener);
    };
}
