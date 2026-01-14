# MCP Extension Library

[![npm version](https://img.shields.io/npm/v/@your-scope/mcp-extension-lib.svg)](https://npmjs.org/package/@your-scope/mcp-extension-lib)

A TypeScript library for building **MCP (Model Context Protocol) servers** in Chrome Extensions. This library allows extensions to expose browser control capabilities through a standardized protocol that AI coding agents can use.

## Features

- 🎯 **Platform-agnostic core** - MCP protocol handling
- 🔌 **Chrome-specific adapters** - Ready-to-use helpers for extension APIs  
- 🚀 **Easy integration** - Minimal setup required
- 📦 **Type-safe** - Full TypeScript support
- 🔄 **Flexible messaging** - chrome.runtime port communication

## Installation

```bash
npm install @your-scope/mcp-extension-lib
```

## Quick Start

### 1. Define Your Tools

Create a `tools/registry.ts` file with your tool definitions:

```typescript
import type {ToolDefinition} from '@your-scope/mcp-extension-lib';

export const toolDefs: ToolDefinition[] = [
  {
    name: 'navigate',
    description: 'Navigate the current tab to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {type: 'string', description: 'The URL to navigate to'},
      },
      required: ['url'],
    },
  },
  {
    name: 'click',
    description: 'Click an element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {type: 'string', description: 'CSS selector'},
      },
      required: ['selector'],
    },
  },
];
```

### 2. Implement Handlers

Create a `tools/handlers.ts` file:

```typescript
import type {ToolHandlers} from '@your-scope/mcp-extension-lib';
import {ok, err} from '@your-scope/mcp-extension-lib';
import * as tabs from '@your-scope/mcp-extension-lib/chrome';

export const handlers: ToolHandlers = {
  async navigate(params, context) {
    try {
      const {url} = params as {url: string};
      const tab = await context.getCurrentTab?.();
      
      if (!tab?.id) {
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
      const {selector} = params as {selector: string};
      const tab = await context.getCurrentTab?.();
      
      if (!tab?.id) {
        return err('No active tab found');
      }
      
      await tabs.clickElement(tab.id, selector);
      return ok(`Clicked: ${selector}`);
    } catch (error) {
      return err(error as Error);
    }
  },
};
```

### 3. Set Up Service Worker

In your extension's `background/sw.ts`:

```typescript
import {createRouter} from '@your-scope/mcp-extension-lib';
import {createMcpExtensionServer} from '@your-scope/mcp-extension-lib/chrome';
import {toolDefs} from './tools/registry';
import {handlers} from './tools/handlers';

// Create router
const router = createRouter({toolDefs, handlers});

// Create and start MCP server
const server = createMcpExtensionServer({
  router,
  transport: {type: 'runtimePort'},
});

server.listen();
```

### 4. Update manifest.json

```json
{
  "manifest_version": 3,
  "name": "Your Extension",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting", "tabs", "storage"],
  "background": {
    "service_worker": "background/sw.js",
    "type": "module"
  },
  "host_permissions": ["<all_urls>"]
}
```

## Architecture

### Core Modules (`@your-scope/mcp-extension-lib`)

- **`protocol.ts`** - MCP message types (tools/list, tools/call)
- **`types.ts`** - ToolDefinition, ToolHandlers, RouterContext
- **`router.ts`** - createRouter() for handling MCP requests
- **`errors.ts`** - ok(), err(), error normalization
- **`validate.ts`** - JSON schema validation

### Chrome Adapters (`@your-scope/mcp-extension-lib/chrome`)

- **`transport/runtimePort.ts`** - chrome.runtime messaging
- **`exec/tabs.ts`** - chrome.tabs API helpers
- **`exec/scripting.ts`** - chrome.scripting API helpers
- **`exec/storage.ts`** - chrome.storage API helpers
- **`server.ts`** - createMcpExtensionServer()

## API Reference

### createRouter(config)

Creates an MCP router that handles tool requests.

```typescript
const router = createRouter({
  toolDefs: ToolDefinition[],
  handlers: ToolHandlers,
  context?: Partial<RouterContext>
});
```

### createMcpExtensionServer(config)

Creates an MCP server for Chrome extensions.

```typescript
const server = createMcpExtensionServer({
  router: Router,
  transport?: {type: 'runtimePort', portName?: string},
  context?: Partial<RouterContext>,
  onError?: (error: Error) => void
});
```

### Chrome Helpers

```typescript
// Tabs
import * as tabs from '@your-scope/mcp-extension-lib/chrome';
await tabs.getCurrentTab();
await tabs.navigateTab(tabId, url);
await tabs.captureScreenshot();

// Scripting
import * as scripting from '@your-scope/mcp-extension-lib/chrome';
await scripting.executeScript(tabId, code);
await scripting.clickElement(tabId, selector);
await scripting.fillInput(tabId, selector, value);

// Storage
import * as storage from '@your-scope/mcp-extension-lib/chrome';
await storage.getStorage('key');
await storage.setStorage('key', value);
```

## Examples

See the [examples/minimal-extension](./examples/minimal-extension) directory for a complete working example.

## TypeScript

This library is written in TypeScript and provides full type definitions.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
