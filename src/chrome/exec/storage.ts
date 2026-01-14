/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Chrome Storage API Helpers
 * Wrappers for chrome.storage operations
 */

export type StorageArea = 'local' | 'sync' | 'session';

/**
 * Get value from storage
 */
export async function getStorage<T>(
    key: string,
    area: StorageArea = 'local',
): Promise<T | undefined> {
    const storage = chrome.storage[area];
    const result = await storage.get(key);
    return result[key] as T | undefined;
}

/**
 * Set value in storage
 */
export async function setStorage<T>(
    key: string,
    value: T,
    area: StorageArea = 'local',
): Promise<void> {
    const storage = chrome.storage[area];
    await storage.set({ [key]: value });
}

/**
 * Remove key from storage
 */
export async function removeStorage(
    key: string,
    area: StorageArea = 'local',
): Promise<void> {
    const storage = chrome.storage[area];
    await storage.remove(key);
}

/**
 * Clear all storage
 */
export async function clearStorage(area: StorageArea = 'local'): Promise<void> {
    const storage = chrome.storage[area];
    await storage.clear();
}

/**
 * Get all keys from storage
 */
export async function getAllStorage<T extends Record<string, unknown>>(
    area: StorageArea = 'local',
): Promise<T> {
    const storage = chrome.storage[area];
    return storage.get(null) as Promise<T>;
}

/**
 * Check if key exists in storage
 */
export async function hasStorage(
    key: string,
    area: StorageArea = 'local',
): Promise<boolean> {
    const storage = chrome.storage[area];
    const result = await storage.get(key);
    return key in result;
}

/**
 * Get storage quota info
 */
export async function getStorageQuota(
    area: StorageArea = 'local',
): Promise<{ bytesInUse: number; quota: number }> {
    const storage = chrome.storage[area];
    const bytesInUse = await storage.getBytesInUse(null);

    // Quota limits (from Chrome docs)
    const quotas = {
        local: 10 * 1024 * 1024, // 10MB
        sync: 100 * 1024, // 100KB
        session: 10 * 1024 * 1024, // 10MB
    };

    return {
        bytesInUse,
        quota: quotas[area],
    };
}

/**
 * Listen to storage changes
 */
export function onStorageChanged(
    callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void,
): () => void {
    chrome.storage.onChanged.addListener(callback);

    return () => {
        chrome.storage.onChanged.removeListener(callback);
    };
}
