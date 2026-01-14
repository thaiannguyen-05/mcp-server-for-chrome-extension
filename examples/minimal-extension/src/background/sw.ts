/**
 * Example Service Worker using Tool Packs
 * Demonstrates the new tool packs structure
 */

import { createRouter } from '../../src/core/router';
import { createMcpExtensionServer } from '../../src/chrome/server';
import { toolPacks, mergeToolPacks } from '../../src/chrome/tools';

// Option 1: Use all tools
// const {definitions, handlers} = toolPacks.allTools;

// Option 2: Use specific tool packs
const tools = mergeToolPacks([
    toolPacks.navigation,
    toolPacks.dom,
    toolPacks.debugging,
]);

// Create router with tools
const router = createRouter({
    toolDefs: tools.definitions,
    handlers: tools.handlers,
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

console.log('[MCP Extension] Service worker started');
console.log('[MCP Extension] Registered tools:', router.getToolDefinitions().map(t => t.name));
console.log('[MCP Extension] Tool count:', router.getToolDefinitions().length);
