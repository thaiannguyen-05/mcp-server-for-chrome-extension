# MCP Extension Library

A TypeScript library for building MCP (Model Context Protocol) servers in Chrome Extensions.

## Features

- 🎯 **Platform-agnostic core** - Protocol handling that works anywhere
- 🔌 **Chrome-specific adapters** - Ready-to-use helpers for extension APIs
- 🚀 **Easy integration** - Minimal setup required
- 📦 **Type-safe** - Full TypeScript support
- 🔄 **Flexible transport** - Support for runtime ports and WebSocket

## Installation

```bash
npm install @your-scope/mcp-extension-lib
```

## Quick Start

### 1. Define your tools

```typescript
// tools/registry.ts
export const toolDefs = [
  {
    name: 'example_tool',
    description: 'An example tool',
    inputSchema: {
      type: 'object',
      properties: {
        param: { type: 'string' }
      }
    }
  }
];
```

### 2. Implement handlers

```typescript
// tools/handlers.ts
export const handlers = {
  example_tool: async (args: { param: string }) => {
    return { result: `You said: ${args.param}` };
  }
};
```

### 3. Set up in service worker

```typescript
// background/sw.ts
import { createRouter } from '@your-scope/mcp-extension-lib';
import { createMcpExtensionServer } from '@your-scope/mcp-extension-lib/chrome';
import { toolDefs } from '../tools/registry';
import { handlers } from '../tools/handlers';

const router = createRouter({ toolDefs, handlers });

createMcpExtensionServer({
  router,
  transport: { type: 'runtimePort' }
});
```

## Architecture

- **`core/`** - Platform-agnostic MCP protocol implementation
- **`chrome/`** - Chrome extension-specific adapters and helpers

## License

MIT
