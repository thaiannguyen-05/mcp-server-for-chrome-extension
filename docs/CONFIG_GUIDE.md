# WebSocket Configuration Guide

This guide shows how to configure WebSocket connection settings dynamically using the library's built-in helpers.

## Quick Start

### 1. Using Config Helpers (Recommended)

The library provides utilities to load/save WebSocket configuration from `chrome.storage`:

```typescript
import { createMcpExtensionServer, createRouter } from '@redonvn/mcp-extension-lib';
import { 
    toolPacks, 
    loadWebSocketConfig,
    onConfigChange 
} from '@redonvn/mcp-extension-lib/chrome';

// Load config from storage with defaults
const config = await loadWebSocketConfig({
    defaultUrl: 'ws://localhost:8012',
    defaultApiKey: 'your-default-key'
});

// Create server with loaded config
const server = createMcpExtensionServer({
    router: createRouter({
        toolDefs: toolPacks.navigation.definitions,
        handlers: toolPacks.navigation.handlers
    }),
    transport: {
        type: 'websocket',
        serverUrl: config.serverUrl,  // From chrome.storage or default
        apiKey: config.apiKey,        // From chrome.storage or default
        reconnect: true
    }
});

server.listen();
```

### 2. Listen for Config Changes

Auto-reconnect when user updates settings:

```typescript
// Listen for config changes
onConfigChange((newConfig) => {
    console.log('Config changed, reconnecting...');
    initializeServer(newConfig);
});
```

## Creating an Options Page

### manifest.json

Add `storage` permission and `options_page`:

```json
{
    "manifest_version": 3,
    "permissions": ["storage", "tabs", "scripting"],
    "options_page": "options.html"
}
```

### options.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Settings</title>
</head>
<body>
    <h1>WebSocket Bridge Settings</h1>
    
    <form id="settingsForm">
        <label>
            WebSocket Server URL:
            <input type="text" id="wsUrl" placeholder="ws://localhost:8012" required>
        </label>
        
        <label>
            API Key:
            <input type="password" id="apiKey" placeholder="Enter your API key" required>
        </label>
        
        <button type="submit">Save Settings</button>
    </form>
    
    <div id="status"></div>
    
    <script src="options.js"></script>
</body>
</html>
```

### options.js

```javascript
const STORAGE_KEY = 'mcp_websocket_config';

async function saveSettings(serverUrl, apiKey) {
    await chrome.storage.sync.set({
        [STORAGE_KEY]: { serverUrl, apiKey }
    });
    
    // Notify background script
    chrome.runtime.sendMessage({
        type: 'settings_updated',
        serverUrl,
        apiKey
    });
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverUrl = document.getElementById('wsUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    await saveSettings(serverUrl, apiKey);
});
```

## API Reference

### `loadWebSocketConfig(options?)`

Load WebSocket configuration from `chrome.storage.sync`.

**Parameters:**
- `options.defaultUrl` (string): Default WebSocket URL if not found in storage
- `options.defaultApiKey` (string): Default API key if not found in storage
- `options.storageKey` (string): Custom storage key (default: `'mcp_websocket_config'`)

**Returns:** `Promise<WebSocketConfig>`

**Example:**
```typescript
const config = await loadWebSocketConfig({
    defaultUrl: 'wss://my-bridge.example.com',
    defaultApiKey: 'fallback-key'
});
```

---

### `saveWebSocketConfig(config, storageKey?)`

Save WebSocket configuration to `chrome.storage.sync`.

**Parameters:**
- `config.serverUrl` (string): WebSocket server URL
- `config.apiKey` (string): API key for authentication
- `storageKey` (string, optional): Custom storage key

**Returns:** `Promise<void>`

**Example:**
```typescript
await saveWebSocketConfig({
    serverUrl: 'wss://production.example.com',
    apiKey: 'prod-key-123'
});
```

---

### `validateWebSocketUrl(url)`

Validate WebSocket URL format.

**Parameters:**
- `url` (string): URL to validate

**Returns:** `string | null` - Error message if invalid, `null` if valid

**Example:**
```typescript
const error = validateWebSocketUrl('ws://localhost:8012');
if (error) {
    console.error('Invalid URL:', error);
}
```

---

### `onConfigChange(callback, storageKey?)`

Listen for configuration changes in `chrome.storage`.

**Parameters:**
- `callback` (function): Called when config changes with new config
- `storageKey` (string, optional): Custom storage key

**Returns:** `function` - Cleanup function to stop listening

**Example:**
```typescript
const stopListening = onConfigChange((newConfig) => {
    console.log('Config updated:', newConfig);
    reconnectWithNewConfig(newConfig);
});

// Later: stop listening
stopListening();
```

---

### `clearWebSocketConfig(storageKey?)`

Clear WebSocket configuration from storage.

**Returns:** `Promise<void>`

**Example:**
```typescript
await clearWebSocketConfig();
```

## Complete Example

See [examples/websocket-bridge-demo](../examples/websocket-bridge-demo) for a full working implementation with:
- ✅ Options page for user input
- ✅ Dynamic config loading
- ✅ Auto-reconnect on settings change
- ✅ Connection status display

## Storage Structure

The library stores config in `chrome.storage.sync` with this structure:

```json
{
    "mcp_websocket_config": {
        "serverUrl": "ws://localhost:8012",
        "apiKey": "your-api-key"
    }
}
```

This allows the config to sync across user's devices automatically.

## TypeScript Types

```typescript
interface WebSocketConfig {
    serverUrl: string;
    apiKey: string;
}

interface StorageConfigOptions {
    defaultUrl?: string;
    defaultApiKey?: string;
    storageKey?: string;
}
```
