# MCP Extension Library

[![npm version](https://img.shields.io/npm/v/@your-scope/mcp-extension-lib.svg)](https://npmjs.org/package/@your-scope/mcp-extension-lib)

A TypeScript library for building **MCP (Model Context Protocol) servers** in Chrome Extensions. This library allows extensions to expose browser control capabilities through a standardized protocol that AI coding agents can use.

## Features

- 🎯 **Built-in Tool Packs** - Pre-built tools for navigation, DOM interaction, and debugging
- 🔌 **Chrome-specific adapters** - Ready-to-use helpers for extension APIs  
- 🚀 **Easy integration** - Import tool packs and start serving
- 📦 **Type-safe** - Full TypeScript support with detailed descriptions
- 🔄 **Flexible** - Use all tools or cherry-pick specific packs
- ⚙️ **Dynamic Configuration** - User-configurable WebSocket settings with chrome.storage

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

## WebSocket Bridge Architecture

For AI agent integration and remote browser control, use the WebSocket Bridge:

```
Extension ↔ WebSocket Bridge ↔ MCP Server ↔ AI Agent
```

### Quick Setup

1. **Start the WebSocket Bridge Server**:

```bash
cd packages/wss-bridge
npm install
cp .env.example .env
# Edit .env: set API_KEYS=your-secure-key
npm run dev
```

2. **Configure Extension** for WebSocket transport:

```typescript
import {createRouter} from '@redonvn/mcp-extension-lib';
import {createMcpExtensionServer, toolPacks} from '@redonvn/mcp-extension-lib/chrome';

const server = createMcpExtensionServer({
  router: createRouter({
    toolDefs: toolPacks.navigation.definitions,
    handlers: toolPacks.navigation.handlers,
  }),
  transport: {
    type: 'websocket',
    serverUrl: 'ws://localhost:8012',
    apiKey: 'your-secure-key',
    reconnect: true,
    onStateChange: (state) => {
      console.log('Connection state:', state); // 'connected', 'disconnected', etc.
    },
  },
});

server.listen();
```

### Dynamic Configuration (Recommended)

Allow users to configure WebSocket URL and API Key through an options page:

```typescript
import {createRouter} from '@redonvn/mcp-extension-lib';
import {
  createMcpExtensionServer,
  toolPacks,
  loadWebSocketConfig,
  onConfigChange
} from '@redonvn/mcp-extension-lib/chrome';

// Load config from chrome.storage with defaults
const config = await loadWebSocketConfig({
  defaultUrl: 'ws://localhost:8012',
  defaultApiKey: 'your-default-key'
});

const server = createMcpExtensionServer({
  router: createRouter({
    toolDefs: toolPacks.navigation.definitions,
    handlers: toolPacks.navigation.handlers,
  }),
  transport: {
    type: 'websocket',
    serverUrl: config.serverUrl,  // User-configurable!
    apiKey: config.apiKey,        // User-configurable!
    reconnect: true,
  },
});

server.listen();

// Auto-reconnect when user changes settings
onConfigChange((newConfig) => {
  console.log('Config changed, reconnecting...');
  // Reinitialize server with new config
});
```

**Benefits:**
- ✅ No hardcoded URLs or API keys
- ✅ Users can switch between dev/prod servers
- ✅ Settings sync across devices via `chrome.storage.sync`
- ✅ Auto-reconnect on settings change

See [Configuration Guide](./docs/CONFIG_GUIDE.md) for complete implementation with options page UI.

See [WebSocket Bridge Demo](./examples/websocket-bridge-demo) for a complete working example.

### Security

- Extension NEVER calls AI APIs directly
- API keys stored server-side only
- Authentication, rate limiting, and session management included
- Production-ready for Railway, Fly.io, or custom deployment

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

### Local Development (Runtime Port)

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
    ├── transport/     # Transport layers
    │   ├── runtimePort.ts  # Local chrome.runtime messaging
    │   └── wsClient.ts     # WebSocket for remote control
    └── server.ts      # MCP Extension Server
```

### Remote Control (WebSocket Bridge)

```
packages/
└── wss-bridge/        # WebSocket Bridge Server
    ├── src/
    │   ├── server.ts      # Main WebSocket server
    │   ├── auth/          # Authentication & rate limiting
    │   ├── mcp/           # MCP client integration
    │   └── types/         # TypeScript definitions
    └── README.md

examples/
└── websocket-bridge-demo/  # Full demo implementation
```

## Transport Options

### Runtime Port (Default)
- **Use case**: Extension-internal communication (popup ↔ background)
- **Setup**: Simple, no external server needed
- **Best for**: Local development, simple extensions

### WebSocket
- **Use case**: AI agent control, remote automation
- **Setup**: Requires WebSocket Bridge server
- **Best for**: Production automation, team collaboration, cloud agents

## Examples

- **[minimal-extension](./examples/minimal-extension)** - Basic extension using RuntimePort transport
- **[websocket-bridge-demo](./examples/websocket-bridge-demo)** - Complete AI agent integration with WebSocket Bridge

See each example's README for detailed setup instructions.

## TypeScript

This library is written in TypeScript and provides full type definitions.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
