import blessed from 'blessed';
import contrib from 'blessed-contrib';
import io from 'socket.io-client';
import config from './config.js';

const socket = io(`http://localhost:${config.port}`);

const screen = blessed.screen({
    smartCSR: true,
    title: 'LLM Provider Chat & Monitor'
});

const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// Layout
const logBox = grid.set(0, 0, 8, 8, contrib.log, {
    fg: 'green',
    selectedFg: 'green',
    label: 'Server Logs'
});

const statusTable = grid.set(0, 8, 4, 4, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Provider Status',
    width: '30%',
    height: '30%',
    border: { type: "line", fg: "cyan" },
    columnSpacing: 2,
    columnWidth: [15, 10]
});

const chatHistory = grid.set(4, 8, 6, 4, blessed.box, {
    label: 'Chat History',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        inverse: true
    },
    border: { type: "line", fg: "magenta" }
});

const input = grid.set(10, 8, 2, 4, blessed.textarea, {
    label: 'Chat Input (Enter to send)',
    inputOnFocus: true,
    border: { type: "line", fg: "yellow" }
});

const modelSelector = grid.set(8, 0, 4, 8, blessed.list, {
    label: 'Select Provider (Auto by default)',
    keys: true,
    mouse: true,
    style: {
        selected: {
            bg: 'blue'
        }
    },
    border: { type: "line", fg: "cyan" }
});

// State
let selectedProviderId = null;
let providersList = [];

// Socket Events
socket.on('connect', () => {
    logBox.log('{green-fg}Connected to server.{/green-fg}');
    screen.render();
});

socket.on('connect_error', (err) => {
    logBox.log(`{red-fg}Connection Error: ${err.message}{/red-fg}`);
    logBox.log('Ensure server is running (npm start)');
    screen.render();
});

socket.on('log', (msg) => {
    logBox.log(msg);
    screen.render();
});

socket.on('status_update', (providers) => {
    providersList = providers;
    const data = providers.map(p => [
        p.name,
        p.status
    ]);
    statusTable.setData({
        headers: ['Provider', 'Status'],
        data: data
    });

    // Update selector list
    const items = ['AUTO (Orchestrator)', ...providers.map(p => p.name)];
    modelSelector.setItems(items);

    screen.render();
});

socket.on('chat_response', (data) => {
    chatHistory.pushLine(`{blue-fg}${data.provider}:{/blue-fg} ${data.content}`);
    chatHistory.setScrollPerc(100);
    screen.render();
});

socket.on('chat_error', (data) => {
    chatHistory.pushLine(`{red-fg}Error:{/red-fg} ${data.message}`);
    screen.render();
});

// Input Handling
input.key('enter', () => {
    const text = input.getValue().trim();
    if (text) {
        chatHistory.pushLine(`{green-fg}You:{/green-fg} ${text}`);
        socket.emit('chat_message', {
            prompt: text,
            providerId: selectedProviderId
        });
        input.clearValue();
        input.focus();
        screen.render();
    }
});

// Model Selection
modelSelector.on('select', (item, index) => {
    if (index === 0) {
        selectedProviderId = null;
        logBox.log('Selected: Auto Orchestration');
    } else {
        const provider = providersList[index - 1];
        selectedProviderId = provider.id;
        logBox.log(`Selected: ${provider.name}`);
    }
    screen.render();
});

// Key bindings
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

input.focus();
screen.render();
