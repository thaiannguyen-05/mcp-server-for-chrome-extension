# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-15

### Added
- **Dynamic Configuration Helpers** - New utilities for managing WebSocket configuration:
  - `loadWebSocketConfig()` - Load config from chrome.storage with defaults
  - `saveWebSocketConfig()` - Save config to chrome.storage.sync
  - `validateWebSocketUrl()` - Validate WebSocket URL format
  - `onConfigChange()` - Listen for configuration changes
  - `clearWebSocketConfig()` - Clear stored configuration
- **Configuration Guide** - Comprehensive documentation in `/docs/CONFIG_GUIDE.md`
- **Options Page Example** - Complete example showing user-configurable settings in `examples/websocket-bridge-demo`
- **Auto-reconnect** - Automatic reconnection when user updates WebSocket settings

### Changed
- Updated example extension to use dynamic configuration instead of hardcoded values
- Enhanced README with dynamic configuration section
- Bumped version to 0.2.0

### Benefits
- No more hardcoded WebSocket URLs or API keys
- Users can easily switch between dev/staging/production servers
- Settings sync across user's devices via `chrome.storage.sync`
- Better security - API keys not in source code

## [0.1.1] - 2026-01-14

### Initial Release
- Core MCP protocol implementation
- Chrome extension adapters (transport, execution, server)
- Built-in tool packs:
  - Navigation tools (navigate, new_page, close_page, list_pages, reload_page)
  - DOM tools (click, fill, getText, waitForSelector)
  - Debugging tools (screenshot, evaluate_script)
- WebSocket Bridge Server for AI agent communication
- RuntimePort transport for local extension communication
- Comprehensive examples and documentation