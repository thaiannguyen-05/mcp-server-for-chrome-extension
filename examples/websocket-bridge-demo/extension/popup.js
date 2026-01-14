/**
 * Popup script - displays connection status
 */

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

const stateMessages = {
    'connected': 'Connected',
    'connecting': 'Connecting...',
    'reconnecting': 'Reconnecting...',
    'disconnected': 'Disconnected',
    'error': 'Connection Error',
};

function updateStatus(state) {
    // Remove all state classes
    statusDot.className = 'status-dot';

    // Add current state class
    if (state) {
        statusDot.classList.add(state);
        statusText.textContent = stateMessages[state] || state;
    } else {
        statusText.textContent = 'Unknown';
    }
}

// Get initial state
chrome.runtime.sendMessage({ type: 'get_connection_state' }, (response) => {
    if (response && response.state) {
        updateStatus(response.state);
    }
});

// Listen for state changes
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'connection_state') {
        updateStatus(message.state);
    }
});
