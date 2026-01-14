# WebSocket Bridge Server

Production-ready WebSocket server that bridges browser extensions to MCP servers for AI agent control.

## Architecture

```
Browser Extension ↔ WebSocket Bridge ↔ MCP Server ↔ AI Agent
```

## Features

- ✅ WebSocket server with authentication
- ✅ API key validation
- ✅ Origin-based CORS protection  
- ✅ Rate limiting (100 req/min per session by default)
- ✅ Session management with auto-cleanup
- ✅ MCP tool call routing
- ✅ Health check endpoint
- ✅ Structured logging with Pino
- ✅ Graceful shutdown handling

## Quick Start

### Installation

```bash
cd packages/wss-bridge
npm install
```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server Port
PORT=8012

# API Keys (comma-separated)
API_KEYS=your-secure-api-key-here

# Allowed Origins (comma-separated) 
ALLOWED_ORIGINS=chrome-extension://your-extension-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Session timeout (30 minutes)
SESSION_TIMEOUT_MS=1800000

# Logging
LOG_LEVEL=info
```

### Development

Start the server in watch mode:

```bash
npm run dev
```

The server will start on `ws://localhost:8012` (or your configured port).

### Production

Build and run:

```bash
npm run build
npm start
```

## Usage

### Extension Connection

```typescript
const ws = new WebSocket('ws://localhost:8012');

ws.addEventListener('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    apiKey: 'your-api-key-here'
  }));
});

ws.addEventListener('message', (event) => {
  const response = JSON.parse(event.data);
  
  if (response.type === 'auth_success') {
    console.log('Authenticated! Session ID:', response.sessionId);
    
    // Call MCP tool
    ws.send(JSON.stringify({
      id: '123',
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'navigate',
        arguments: {
          url: 'https://example.com'
        }
      }
    }));
  }
});
```

### Health Check

```bash
curl http://localhost:8012/health
```

Response:

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "connections": 2,
  "mcpConnected": true,
  "timestamp": "2026-01-14T10:58:02.000Z"
}
```

## Message Protocol

### Authentication

**Request**:
```json
{
  "type": "auth",
  "apiKey": "your-api-key"
}
```

**Success Response**:
```json
{
  "type": "auth_success",
  "sessionId": "uuid-here",
  "message": "Authentication successful"
}
```

**Error Response**:
```json
{
  "type": "auth_error",
  "message": "Invalid API key"
}
```

### Tool Call

**Request**:
```json
{
  "id": "unique-request-id",
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "navigate",
    "arguments": {
      "url": "https://example.com"
    }
  }
}
```

**Success Response**:
```json
{
  "id": "unique-request-id",
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Navigated to https://example.com"
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "id": "unique-request-id",
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Tool execution failed",
    "data": {
      "tool": "navigate"
    }
  }
}
```

### Ping/Pong (Keep-Alive)

**Request**:
```json
{
  "type": "ping"
}
```

**Response**:
```json
{
  "type": "pong",
  "timestamp": 1705234682000
}
```

## Security

### API Key Authentication

- All connections must authenticate with a valid API key
- API keys are configured via the `API_KEYS` environment variable
- Multiple keys can be configured (comma-separated)

### Origin Validation

- Connections are validated against the `ALLOWED_ORIGINS` list
- Set to specific extension IDs in production
- Wildcard (`*`) is allowed for development only

### Rate Limiting

- Each session is limited to `RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MS`
- Default: 100 requests per minute
- Exceeded requests receive a 429 error

### Session Management

- Sessions expire after `SESSION_TIMEOUT_MS` of inactivity
- Default: 30 minutes
- Expired sessions are automatically cleaned up

## Production Deployment

### Environment Variables (Required)

```env
NODE_ENV=production
PORT=8080
API_KEYS=random-secure-key-here
ALLOWED_ORIGINS=chrome-extension://your-extension-id
```

### Using Railway

1. Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. Deploy:

```bash
railway up
```

3. Set environment variables in Railway dashboard

4. Your bridge will be available at `wss://your-app.railway.app`

### Using Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 8012

CMD ["node", "dist/server.js"]
```

## Monitoring

### Logs

Structured JSON logs with Pino:

```json
{
  "level": "info",
  "time": 1705234682000,
  "msg": "WebSocket Bridge Server started",
  "port": 8012,
  "apiKeysConfigured": 2
}
```

In development, logs are pretty-printed:

```
[10:58:02] INFO: WebSocket Bridge Server started
    port: 8012
    apiKeysConfigured: 2
```

### Health Checks

Use the `/health` endpoint for uptime monitoring:

```bash
# With curl
curl http://localhost:8012/health

# With wget
wget -qO- http://localhost:8012/health
```

## Troubleshooting

### Connection Refused

- Check that the bridge server is running
- Verify the port is correct
- Check firewall rules

### Invalid API Key

- Verify API key matches value in `.env`
- Check that `.env` file is being loaded
- Restart server after changing `.env`

### Origin Blocked

- Add your extension ID or origin to `ALLOWED_ORIGINS`
- Format: `chrome-extension://extension-id-here`
- Restart server after changes

### Rate Limit Exceeded

- Increase `RATE_LIMIT_MAX_REQUESTS` if needed
- Add delay between requests in extension
- Check for infinite loops in code

## License

MIT
