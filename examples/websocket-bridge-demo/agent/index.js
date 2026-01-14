/**
 * AI Agent Demo
 * Simulates an AI agent controlling the browser via WebSocket Bridge
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8012';
const API_KEY = 'demo-key-12345';

class BridgeClient {
    constructor(url, apiKey) {
        this.url = url;
        this.apiKey = apiKey;
        this.ws = null;
        this.authenticated = false;
        this.requestId = 0;
        this.pendingRequests = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.on('open', () => {
                console.log('✅ Connected to WebSocket Bridge');
                this.authenticate().then(resolve).catch(reject);
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                reject(error);
            });

            this.ws.on('close', () => {
                console.log('🔌 Connection closed');
            });
        });
    }

    async authenticate() {
        return new Promise((resolve, reject) => {
            const authHandler = (message) => {
                if (message.type === 'auth_success') {
                    console.log('✅ Authenticated successfully');
                    console.log(`   Session ID: ${message.sessionId}`);
                    this.authenticated = true;
                    resolve();
                } else if (message.type === 'auth_error') {
                    console.error('❌ Authentication failed:', message.message);
                    reject(new Error(message.message));
                }
            };

            this.pendingRequests.set('auth', { resolve: authHandler, reject });

            this.ws.send(JSON.stringify({
                type: 'auth',
                apiKey: this.apiKey,
            }));
        });
    }

    handleMessage(message) {
        // Handle auth responses
        if (message.type === 'auth_success' || message.type === 'auth_error') {
            const pending = this.pendingRequests.get('auth');
            if (pending) {
                pending.resolve(message);
                this.pendingRequests.delete('auth');
            }
            return;
        }

        // Handle pong
        if (message.type === 'pong') {
            return;
        }

        // Handle tool call responses
        if (message.id && this.pendingRequests.has(message.id)) {
            const pending = this.pendingRequests.get(message.id);
            this.pendingRequests.delete(message.id);

            if (message.error) {
                pending.reject(new Error(message.error.message));
            } else {
                pending.resolve(message.result);
            }
        }
    }

    async callTool(name, args = {}) {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        const id = `req-${++this.requestId}`;

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            this.ws.send(JSON.stringify({
                id,
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name,
                    arguments: args,
                },
            }));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Demo automation flow
async function runDemo() {
    console.log('🤖 MCP Bridge Agent Demo\n');
    console.log('Connecting to bridge server...\n');

    const client = new BridgeClient(WS_URL, API_KEY);

    try {
        await client.connect();
        console.log('');

        // Demo scenario
        console.log('📋 Running Demo Scenario:\n');

        // Step 1: Navigate to example.com
        console.log('1️⃣  Navigating to example.com...');
        const navResult = await client.callTool('navigate', {
            url: 'https://example.com',
        });
        console.log(`   ✅ ${navResult.content[0].text}\n`);

        // Wait a bit for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Take screenshot
        console.log('2️⃣  Taking screenshot...');
        const screenshotResult = await client.callTool('screenshot');
        console.log(`   ✅ Screenshot captured (${screenshotResult.content[0].data.substring(0, 50)}...)\n`);

        // Step 3: Get page title
        console.log('3️⃣  Getting page title...');
        const titleResult = await client.callTool('evaluate_script', {
            code: 'document.title',
        });
        console.log(`   ✅ Page title: "${titleResult.content[0].text}"\n`);

        // Step 4: Extract some text
        console.log('4️⃣  Extracting page heading...');
        const textResult = await client.callTool('dom.getText', {
            selector: 'h1',
        });
        console.log(`   ✅ Heading text: "${textResult.content[0].text}"\n`);

        // Step 5: List all tabs
        console.log('5️⃣  Listing open tabs...');
        const tabsResult = await client.callTool('list_pages');
        console.log(`   ✅ ${tabsResult.content[0].text}\n`);

        console.log('✨ Demo completed successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.disconnect();
    }
}

// Run the demo
runDemo();
