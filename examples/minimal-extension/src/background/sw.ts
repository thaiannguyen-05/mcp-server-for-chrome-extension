/**
 * Example Service Worker for Extension
 */

import { createRouter } from '../../src/core/router';
import { createMcpExtensionServer } from '../../src/chrome/server';
import { toolDefs } from './tools/registry';
import { handlers } from './tools/handlers';

// Create router with tools
const router = createRouter({
    toolDefs,
    handlers,
});

// Create MCP Extension Server
const server = createMcpExtensionServer({
    router,
    transport: {
        type: 'runtimePort',
        portName: 'mcp-extension',
    },
    onError: (error) => {
        console.error('[MCP Server Error]', error);
    },
});

// Start listening for connections
server.listen();

console.log('[MCP Extension] Service worker started and listening for connections');

// Log registered tools
console.log('[MCP Extension] Registered tools:', router.getToolDefinitions().map(t => t.name));
