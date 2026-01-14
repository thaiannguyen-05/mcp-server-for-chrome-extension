# MCP Extension Library

[![npm version](https://img.shields.io/npm/v/@your-scope/mcp-extension-lib.svg)](https://npmjs.org/package/@your-scope/mcp-extension-lib)

A TypeScript library for building **MCP (Model Context Protocol) servers** in Chrome Extensions. This library allows extensions to expose browser control capabilities through a standardized protocol that AI coding agents can use.

## Features

- 🎯 **Built-in Tool Packs** - Pre-built tools for navigation, DOM interaction, and debugging
- 🔌 **Chrome-specific adapters** - Ready-to-use helpers for extension APIs  
- 🚀 **Easy integration** - Import tool packs and start serving
- 📦 **Type-safe** - Full TypeScript support with detailed descriptions
- 🔄 **Flexible** - Use all tools or cherry-pick specific packs

## Installation

```bash
npm install @your-scope/mcp-extension-lib
```

## Quick Start

### 1. Use Built-in Tool Packs

In your extension's `background/sw.ts`:

```typescript
import {createRouter} from '@your-scope/mcp-extension-lib';
import {createMcpExtensionServer} from '@your-scope/mcp-extension-lib/chrome';
import {toolPacks, mergeToolPacks} from '@your-scope/mcp-extension-lib/chrome';

// Option 1: Use all available tools
// import {allTools} from '@your-scope/mcp-extension-lib/chrome';
// const router = createRouter({
//   toolDefs: allTools.definitions,
//   handlers: allTools.handlers,
// });

// Option 2: Select specific tool packs
const tools = mergeToolPacks([
  toolPacks.navigation,  // navigate, new_page, close_page, list_pages, reload_page
  toolPacks.dom,         // dom.click, dom.fill, dom.getText, dom.waitForSelector
  toolPacks.debugging,   // screenshot, evaluate_script
]);

const router = createRouter({
  toolDefs: tools.definitions,
  handlers: tools.handlers,
});

// Start MCP server
const server = createMcpExtensionServer({
  router,
  transport: {type: 'runtimePort'},
});

server.listen();
```

### 2. Update manifest.json

```json
{
  "manifest_version": 3,
  "name": "Your Extension",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting", "tabs"],
  "background": {
    "service_worker": "background/sw.js",
    "type": "module"
  },
  "host_permissions": ["<all_urls>"]
}
```

## Available Tool Packs

### Navigation Tools (`toolPacks.navigation`)

| Tool | Description |
|------|-------------|
| `navigate` | Navigate the current tab to a URL |
| `new_page` | Create a new tab and navigate to URL |
| `close_page` | Close a tab by ID |
| `list_pages` | List all open tabs |
| `reload_page` | Reload a tab (with optional cache bypass) |

### DOM Tools (`toolPacks.dom`)

| Tool | Description |
|------|-------------|
| `dom.click` | Click element by CSS selector |
| `dom.fill` | Fill input/textarea/select element |
| `dom.getText` | Get text content of an element |
| `dom.waitForSelector` | Wait for element to appear in DOM |

### Debugging Tools (`toolPacks.debugging`)

| Tool | Description |
|------|-------------|
| `screenshot` | Capture screenshot of visible tab area |
| `evaluate_script` | Execute JavaScript and return result |

## Custom Tools

You can also create custom tool packs:

```typescript
import type {ToolPack} from '@your-scope/mcp-extension-lib/chrome';
import {ok, err} from '@your-scope/mcp-extension-lib';

const customTools: ToolPack = {
  definitions: [
    {
      name: 'custom.doSomething',
      description: 'Do something custom',
      inputSchema: {
        type: 'object',
        properties: {
          param: {type: 'string', description: 'Parameter description'},
        },
        required: ['param'],
      },
      annotations: {
        category: 'custom',
        readOnlyHint: false,
      },
    },
  ],
  handlers: {
    async 'custom.doSomething'(params, context) {
      try {
        // Implementation
        return ok('Success!');
      } catch (error) {
        return err(error as Error);
      }
    },
  },
};

// Merge with built-in tools
const tools = mergeToolPacks([
  toolPacks.navigation,
  customTools,
]);
```

## API Reference

### Tool Packs

```typescript
import {toolPacks, mergeToolPacks, allTools} from '@your-scope/mcp-extension-lib/chrome';

// Individual packs
toolPacks.navigation
toolPacks.dom
toolPacks.debugging

// Merge multiple packs
const tools = mergeToolPacks([...packs]);

// All tools combined
allTools.definitions
allTools.handlers
```

### Chrome Helpers

```typescript
import * as tabs from '@your-scope/mcp-extension-lib/chrome';
import * as scripting from '@your-scope/mcp-extension-lib/chrome';
import * as storage from '@your-scope/mcp-extension-lib/chrome';
```

## Architecture

```
src/
├── core/              # Platform-agnostic MCP protocol
│   ├── protocol.ts    # MCP message types
│   ├── router.ts      # Request router
│   └── types.ts       # Type definitions
└── chrome/            # Chrome extension adapter
    ├── tools/         # Built-in tool packs
    │   ├── navigation.ts
    │   ├── dom.ts
    │   └── debugging.ts
    ├── exec/          # Chrome API helpers
    └── server.ts      # MCP Extension Server
```

## Examples

See the [examples/minimal-extension](./examples/minimal-extension) directory for a complete working example.

## TypeScript

This library is written in TypeScript and provides full type definitions.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
