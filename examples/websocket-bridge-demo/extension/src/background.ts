/**
 * Background Service Worker
 * Connects to WebSocket Bridge and handles tool execution
 */

import { createMcpExtensionServer } from '@redonvn/mcp-extension-lib/chrome';
import { createRouter } from '@redonvn/mcp-extension-lib';
import {
    toolPacks,
    mergeToolPacks,
    loadWebSocketConfig,
    onConfigChange,
    type WebSocketConfig
} from '@redonvn/mcp-extension-lib/chrome';

// Merge tool packs
const tools = mergeToolPacks([
    toolPacks.navigation,
    toolPacks.dom,
    toolPacks.debugging,
]);

// Create router
const router = createRouter({
    toolDefs: tools.definitions,
    handlers: tools.handlers,
});

// Global server instance
let server: ReturnType<typeof createMcpExtensionServer> | null = null;

/**
 * Initialize MCP server with provided config
 */
async function initializeServer(config: WebSocketConfig) {
    // Disconnect existing server if any
    if (server) {
        const transport = server.getTransport();
        if ('disconnect' in transport && typeof transport.disconnect === 'function') {
            transport.disconnect();
        }
    }

    // Create MCP server with WebSocket transport
    server = createMcpExtensionServer({
        router,
        transport: {
            type: 'websocket',
            serverUrl: config.serverUrl,
            apiKey: config.apiKey,
            reconnect: true,
            maxReconnectAttempts: 5,
            onStateChange: (state) => {
                console.log('[MCP Extension] Connection state:', state);

                // Send state to popup if open
                chrome.runtime.sendMessage({
                    type: 'connection_state',
                    state,
                }).catch(() => {
                    // Popup not open, ignore
                });
            },
        },
        onError: (error) => {
            console.error('[MCP Extension] Error:', error);
        },
    });

    // Start listening (connects to WebSocket bridge)
    server.listen();

    console.log('[MCP Extension] Background service worker initialized');
    console.log(`[MCP Extension] Connecting to ${config.serverUrl}`);
}

// Initialize server with saved config
loadWebSocketConfig({
    defaultUrl: 'ws://localhost:8012',
    defaultApiKey: 'demo-key-12345'
}).then(initializeServer);

// Listen for config changes and reconnect
onConfigChange((newConfig) => {
    console.log('[MCP Extension] Config changed, reconnecting...');
    initializeServer(newConfig);
});

// Handle messages from popup and options page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'get_connection_state') {
        if (server) {
            const transport = server.getTransport();
            if ('getState' in transport) {
                sendResponse({ state: transport.getState() });
            } else {
                sendResponse({ state: 'unknown' });
            }
        } else {
            sendResponse({ state: 'disconnected' });
        }
        return false;
    }

    if (message.type === 'settings_updated') {
        console.log('[MCP Extension] Settings updated, reconnecting...');
        initializeServer({
            serverUrl: message.serverUrl,
            apiKey: message.apiKey
        });
        sendResponse({ success: true });
        return false;
    }
});
