/**
 * Background Service Worker
 * Connects to WebSocket Bridge and handles tool execution
 */

import { createMcpExtensionServer } from '@redonvn/mcp-extension-lib/chrome';
import { createRouter } from '@redonvn/mcp-extension-lib';
import { toolPacks, mergeToolPacks } from '@redonvn/mcp-extension-lib/chrome';

// Configuration
const WS_SERVER_URL = 'ws://localhost:8012';
const API_KEY = 'demo-key-12345';

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

// Create MCP server with WebSocket transport
const server = createMcpExtensionServer({
    router,
    transport: {
        type: 'websocket',
        serverUrl: WS_SERVER_URL,
        apiKey: API_KEY,
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
console.log(`[MCP Extension] Connecting to ${WS_SERVER_URL}`);

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'get_connection_state') {
        const transport = server.getTransport();
        if ('getState' in transport) {
            sendResponse({ state: transport.getState() });
        } else {
            sendResponse({ state: 'unknown' });
        }
        return false;
    }
});
