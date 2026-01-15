/**
 * Options page script - handles settings save/load
 * Note: This uses plain JS instead of importing from the library
 * because it runs in the options page context.
 */

const DEFAULT_CONFIG = {
    serverUrl: 'ws://localhost:8012',
    apiKey: 'demo-key-12345'
};

const STORAGE_KEY = 'mcp_websocket_config';

const form = document.getElementById('settingsForm');
const wsUrlInput = document.getElementById('wsUrl');
const apiKeyInput = document.getElementById('apiKey');
const resetBtn = document.getElementById('resetBtn');
const statusDiv = document.getElementById('status');

/**
 * Load saved settings from chrome.storage
 */
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEY);
        const config = result[STORAGE_KEY];

        wsUrlInput.value = config?.serverUrl || DEFAULT_CONFIG.serverUrl;
        apiKeyInput.value = config?.apiKey || DEFAULT_CONFIG.apiKey;

        console.log('[Options] Settings loaded');
    } catch (error) {
        console.error('[Options] Failed to load settings:', error);
        showStatus('Failed to load settings', 'error');
    }
}

/**
 * Save settings to chrome.storage
 */
async function saveSettings(serverUrl, apiKey) {
    try {
        await chrome.storage.sync.set({
            [STORAGE_KEY]: { serverUrl, apiKey }
        });
        console.log('[Options] Settings saved');
        showStatus('✓ Settings saved successfully! Extension will reconnect with new settings.', 'success');

        // Notify background script to reconnect with new settings
        chrome.runtime.sendMessage({
            type: 'settings_updated',
            serverUrl,
            apiKey
        }).catch(() => {
            // Background script might be reloading
            console.log('[Options] Background script not ready, will use new settings on next start');
        });
    } catch (error) {
        console.error('[Options] Failed to save settings:', error);
        showStatus('Failed to save settings: ' + error.message, 'error');
    }
}

/**
 * Show status message
 */
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Validate WebSocket URL
 */
function validateWsUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
            return 'URL must start with ws:// or wss://';
        }
        return null;
    } catch (error) {
        return 'Invalid URL format';
    }
}

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const serverUrl = wsUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Validate inputs
    if (!serverUrl || !apiKey) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    const urlError = validateWsUrl(serverUrl);
    if (urlError) {
        showStatus(urlError, 'error');
        return;
    }

    if (apiKey.length < 8) {
        showStatus('API key should be at least 8 characters', 'error');
        return;
    }

    await saveSettings(serverUrl, apiKey);
});

/**
 * Handle reset button
 */
resetBtn.addEventListener('click', () => {
    wsUrlInput.value = DEFAULT_CONFIG.serverUrl;
    apiKeyInput.value = DEFAULT_CONFIG.apiKey;
    showStatus('Reset to default values (not saved yet)', 'success');
});

// Load settings when page opens
loadSettings();
