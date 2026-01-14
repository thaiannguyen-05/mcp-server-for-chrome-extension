# WebSocket Bridge Demo

Complete example demonstrating the full WebSocket Bridge architecture:

**Extension** ↔ **WS Bridge** ↔ **MCP Server** ↔ **AI Agent**

## Components

### 1. Extension (`extension/`)

Browser extension that connects to the WebSocket Bridge server to receive commands from AI agents.

### 2. WebSocket Bridge (`../../packages/wss-bridge`)

See the bridge server README for setup instructions.

### 3. AI Agent (`agent/`)

Example Node.js script simulating an AI agent that controls the browser via MCP tools.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Chrome browser

### Setup

1. **Install dependencies**:

```bash
# Install bridge server dependencies
cd ../../packages/wss-bridge
npm install

# Install agent dependencies  
cd ../../examples/websocket-bridge-demo/agent
npm install

# Build extension
cd ../extension
npm install && npm run build
```

2. **Start the WebSocket Bridge**:

```bash
cd ../../packages/wss-bridge
cp .env.example .env
# Edit .env and set API_KEY=demo-key-12345
npm run dev
```

The bridge will start on `ws://localhost:8012`

3. **Load the Extension**:

- Open Chrome and go to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `examples/websocket-bridge-demo/extension/dist`

4. **Run the AI Agent**:

```bash
cd ../agent
npm start
```

---

## How It Works

### Extension Flow

1. Extension loads and connects to `ws://localhost:8012`
2. Authenticates with API key
3. Listens for tool call commands
4. Executes commands (navigate, click, extract data, etc.)
5. Returns results to bridge

### AI Agent Flow

1. Agent connects to WebSocket Bridge
2. Lists available MCP tools
3. Sends tool call requests (e.g., "navigate to google.com")
4. Receives responses from extension via bridge
5. Uses results to make next decision

---

## Example Commands

Once everything is running, the agent demo will:

1. ✅ Navigate to `https://example.com`
2. ✅ Take a screenshot
3. ✅ Extract all links from the page
4. ✅ Click a specific element
5. ✅ Fill a form input
6. ✅ Get page title

Check the bridge server logs to see the flow of messages.

---

## Architecture Diagram

```
┌─────────────┐         WebSocket          ┌──────────────┐
│  Extension  │ ←────── ws://localhost ───→ │  WS Bridge   │
│  (Chrome)   │         (authenticated)     │   Server     │
└─────────────┘                             └──────────────┘
                                                    ↕
                                             MCP Protocol
                                                    ↕
                                            ┌──────────────┐
                                            │  MCP Server  │
                                            │   (Tools)    │
                                            └──────────────┘
                                                    ↕
                                              Tool Calls
                                                    ↕
                                            ┌──────────────┐
                                            │  AI Agent    │
                                            │  (Node.js)   │
                                            └──────────────┘
```

---

## Security Note

This demo uses a simple API key for authentication. In production:

- Use strong random API keys (32+ characters)
- Store keys securely (environment variables, secret managers)
- Use HTTPS/WSS for remote deployments
- Implement rate limiting
- Validate all origins

---

## Troubleshooting

### Extension won't connect

- Check bridge server is running (`npm run dev`)
- Verify API key matches in `.env` and extension config
- Check browser console for errors

### Tool calls fail

- Ensure extension has necessary permissions in `manifest.json`
- Check target website allows extension interaction
- Review bridge server logs for errors

### Authentication fails

- Verify API_KEY in `.env` matches extension config
- Restart bridge server after changing `.env`
- Check ALLOWED_ORIGINS includes extension ID

---

## Next Steps

- Modify `agent/index.ts` to add custom automation flows
- Add new tools to the MCP library
- Deploy bridge server to Railway/Fly.io for remote access
- Integrate with OpenAI for natural language commands
