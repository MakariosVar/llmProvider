import blessed from 'blessed';
import contrib from 'blessed-contrib';
import axios from 'axios';
import fs from 'fs';

const screen = blessed.screen({ smartCSR: true, title: 'Stress Test PRO' });
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

const throughputDisplay = grid.set(0, 0, 4, 8, contrib.table, {
    label: 'THROUGHPUT METRICS',
    columnWidth: [20, 20]
});

const globalStats = grid.set(0, 8, 4, 4, contrib.table, {
    label: 'SYSTEM STATUS',
    columnWidth: [12, 15]
});

const table = grid.set(4, 0, 6, 12, contrib.table, {
    keys: true,
    label: 'PROVIDER PERFORMANCE',
    columnWidth: [22, 8, 8, 8, 8, 10]
});

const log = grid.set(10, 0, 2, 12, contrib.log, { label: 'API LOGS', fg: 'green' });

let isRunning = false;
let stats = {};
let total = { reqs: 0, succ: 0, fail: 0, tokens: 0 };
const API_URL = 'http://localhost:3000/api/ai';
const errorLog = fs.createWriteStream('stress_test_errors.log', { flags: 'a' });

async function getValidModels() {
    try {
        const res = await axios.get('http://localhost:3000/api/status');
        const providers = res.data.providers;
        const validModels = [];
        providers.forEach(p => {
            if (p.id !== 'ollama' && p.type !== 'image') {
                (p.models || []).forEach(m => {
                    validModels.push({ providerId: p.id, model: m });
                });
            }
        });
        return validModels;
    } catch (e) {
        log.log(`{red-fg}Failed to fetch models from API{/}`);
        return [];
    }
}

async function runWorker(providerId, model) {
    const key = `${providerId.substring(0,8)}/${model.substring(0,8)}`;
    if (!stats[key]) stats[key] = { reqs: 0, succ: 0, fail: 0, tokens: 0, lat: 0 };
    
    while (isRunning) {
        stats[key].reqs++;
        total.reqs++;

        try {
            const start = Date.now();
            const res = await axios.post(API_URL, { prompt: 'Stress test', model }, { timeout: 15000 });
            const lat = Date.now() - start;
            
            stats[key].succ++;
            total.succ++;
            stats[key].lat = (stats[key].lat * 0.8 + lat * 0.2);
            if(res.data.tokens) { stats[key].tokens += res.data.tokens; total.tokens += res.data.tokens; }
            log.log(`{green-fg}OK{/}: ${key} (${lat}ms)`);
        } catch (e) {
            stats[key].fail++;
            total.fail++;
            errorLog.write(JSON.stringify({key, error: e.message, status: e.response?.status}) + '\n');
            log.log(`{red-fg}ERR{/}: ${key} (Check log)`);
        }
        await new Promise(r => setTimeout(r, 5000));
    }
}

function updateDisplay() {
    throughputDisplay.setData({ 
        headers: ['Metric', 'Value'],
        data: [['Status', isRunning ? 'Running' : 'Paused'], ['Delay', '5000ms']] 
    });
    
    globalStats.setData({ 
        headers: ['Metric', 'Value'],
        data: [ ['Total', total.reqs.toString()], ['Succ', total.succ.toString()], ['Fail', total.fail.toString()] ]
    });

    const data = [];
    for (const [key, s] of Object.entries(stats)) {
        data.push([
            key, s.reqs.toString(), s.succ.toString(), s.fail.toString(), 
            `${Math.round(s.lat)}ms`, (s.tokens/1000).toFixed(0)+'k'
        ]);
    }
    table.setData({ headers: ['Provider/Model', 'Req', 'Succ', 'Fail', 'Lat', 'Toks'], data });
    screen.render();
}

screen.key(['q', 'C-c'], () => process.exit(0));
screen.key(['s'], async () => { 
    if (!isRunning) { 
        isRunning = true; 
        const validModels = await getValidModels();
        validModels.forEach(item => runWorker(item.providerId, item.model)); 
    }
});
screen.key(['p'], () => { isRunning = false; });

setInterval(updateDisplay, 1000);
log.log('Press [s] to Start, [p] to Pause, [q] to Quit.');
screen.render();
