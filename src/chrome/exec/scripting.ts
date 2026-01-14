/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Chrome Scripting API Helpers
 * Wrappers for chrome.scripting.executeScript operations
 */

export interface ScriptExecutionResult<T = unknown> {
    result: T;
    frameId: number;
}

/**
 * Execute script in tab
 */
export async function executeScript<T = unknown>(
    tabId: number,
    code: string,
): Promise<T> {
    const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: new Function(`return (${code})`) as () => T,
    });

    if (!results || results.length === 0) {
        throw new Error('Script execution failed: No results returned');
    }

    return results[0].result as T;
}

/**
 * Execute function in tab
 */
export async function executeFunction<TArgs extends unknown[], TResult>(
    tabId: number,
    func: (...args: TArgs) => TResult,
    args: TArgs,
): Promise<TResult> {
    const results = await chrome.scripting.executeScript({
        target: { tabId },
        func,
        args,
    });

    if (!results || results.length === 0) {
        throw new Error('Function execution failed: No results returned');
    }

    return results[0].result as TResult;
}

/**
 * Execute script in all frames
 */
export async function executeScriptInAllFrames<T = unknown>(
    tabId: number,
    code: string,
): Promise<ScriptExecutionResult<T>[]> {
    const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: new Function(`return (${code})`) as () => T,
    });

    return results.map(r => ({
        result: r.result as T,
        frameId: r.frameId,
    }));
}

/**
 * Insert CSS into tab
 */
export async function insertCSS(
    tabId: number,
    css: string,
): Promise<void> {
    await chrome.scripting.insertCSS({
        target: { tabId },
        css,
    });
}

/**
 * Remove CSS from tab
 */
export async function removeCSS(
    tabId: number,
    css: string,
): Promise<void> {
    await chrome.scripting.removeCSS({
        target: { tabId },
        css,
    });
}

/**
 * Click element by selector
 */
export async function clickElement(
    tabId: number,
    selector: string,
): Promise<void> {
    await executeFunction(
        tabId,
        (sel: string) => {
            const element = document.querySelector(sel) as HTMLElement;
            if (!element) {
                throw new Error(`Element not found: ${sel}`);
            }
            element.click();
        },
        [selector],
    );
}


/**
 * Fill input by selector
 */
export async function fillInput(
    tabId: number,
    selector: string,
    value: string,
): Promise<void> {
    await executeFunction(
        tabId,
        (sel: string, val: string) => {
            const element = document.querySelector(sel) as HTMLInputElement;
            if (!element) {
                throw new Error(`Element not found: ${sel}`);
            }
            element.value = val;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        },
        [selector, value],
    );
}

/**
 * Get element text content
 */
export async function getElementText(
    tabId: number,
    selector: string,
): Promise<string> {
    return executeFunction(
        tabId,
        (sel: string) => {
            const element = document.querySelector(sel);
            if (!element) {
                throw new Error(`Element not found: ${sel}`);
            }
            return element.textContent || '';
        },
        [selector],
    );
}

/**
 * Wait for selector
 */
export async function waitForSelector(
    tabId: number,
    selector: string,
    timeout = 5000,
): Promise<void> {
    await executeFunction(
        tabId,
        (sel: string, ms: number) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                const checkElement = () => {
                    const element = document.querySelector(sel);
                    if (element) {
                        resolve(element);
                        return;
                    }

                    if (Date.now() - startTime > ms) {
                        reject(new Error(`Timeout waiting for selector: ${sel}`));
                        return;
                    }

                    setTimeout(checkElement, 100);
                };

                checkElement();
            });
        },
        [selector, timeout],
    );
}
