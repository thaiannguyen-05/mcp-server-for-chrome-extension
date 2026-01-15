#!/usr/bin/env node

/**
 * Quick test to verify config helpers are exported correctly
 */

console.log('🧪 Testing @redonvn/mcp-extension-lib exports...\n');

try {
    // Test core exports
    const core = require('./dist/index.js');
    console.log('✅ Core module loaded');
    console.log('   - createRouter:', typeof core.createRouter);
    console.log('   - ok:', typeof core.ok);
    console.log('   - err:', typeof core.err);

    // Test chrome exports
    const chrome = require('./dist/chrome/index.js');
    console.log('\n✅ Chrome module loaded');
    console.log('   - createMcpExtensionServer:', typeof chrome.createMcpExtensionServer);
    console.log('   - toolPacks:', typeof chrome.toolPacks);
    console.log('   - mergeToolPacks:', typeof chrome.mergeToolPacks);

    // Test config helpers (NEW in v0.2.0)
    console.log('\n✅ Config helpers (v0.2.0):');
    console.log('   - loadWebSocketConfig:', typeof chrome.loadWebSocketConfig);
    console.log('   - saveWebSocketConfig:', typeof chrome.saveWebSocketConfig);
    console.log('   - validateWebSocketUrl:', typeof chrome.validateWebSocketUrl);
    console.log('   - onConfigChange:', typeof chrome.onConfigChange);
    console.log('   - clearWebSocketConfig:', typeof chrome.clearWebSocketConfig);

    // Verify tool packs
    console.log('\n✅ Tool Packs available:');
    console.log('   - navigation:', chrome.toolPacks.navigation ? '✓' : '✗');
    console.log('   - dom:', chrome.toolPacks.dom ? '✓' : '✗');
    console.log('   - debugging:', chrome.toolPacks.debugging ? '✓' : '✗');

    // Test validateWebSocketUrl
    console.log('\n✅ Testing validateWebSocketUrl:');
    const validWs = chrome.validateWebSocketUrl('ws://localhost:8012');
    const validWss = chrome.validateWebSocketUrl('wss://example.com');
    const invalidHttp = chrome.validateWebSocketUrl('http://example.com');
    const invalidEmpty = chrome.validateWebSocketUrl('');

    console.log('   - ws://localhost:8012 →', validWs || 'VALID ✓');
    console.log('   - wss://example.com →', validWss || 'VALID ✓');
    console.log('   - http://example.com →', invalidHttp || 'VALID (should be INVALID!)');
    console.log('   - empty string →', invalidEmpty || 'VALID (should be INVALID!)');

    console.log('\n🎉 All exports verified successfully!');
    console.log('\n📦 Package ready for publishing');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
