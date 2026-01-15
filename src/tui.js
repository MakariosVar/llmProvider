import blessed from 'blessed';
import contrib from 'blessed-contrib';
import providerManager from './providerManager.js';

class TUI {
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'LLM Provider Orchestrator'
        });

        this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

        // Layout
        this.logBox = this.grid.set(0, 0, 8, 8, contrib.log, {
            fg: 'green',
            selectedFg: 'green',
            label: 'Server Logs'
        });

        this.statusTable = this.grid.set(0, 8, 8, 4, contrib.table, {
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
            columnWidth: [15, 10, 10]
        });

        this.usageLine = this.grid.set(8, 0, 4, 12, contrib.line, {
            style: { line: "yellow", text: "green", baseline: "black" },
            xLabelPadding: 3,
            xPadding: 5,
            showLegend: true,
            wholeFile: true,
            label: 'Requests per Minute'
        });

        this.screen.key(['escape', 'q', 'C-c'], function (ch, key) {
            return process.exit(0);
        });

        this.screen.render();

        // Mock data for line chart
        this.usageData = {
            title: 'Total Requests',
            x: Array(60).fill(0).map((_, i) => i.toString()),
            y: Array(60).fill(0)
        };

        this.startUpdateLoop();
    }

    log(msg) {
        this.logBox.log(msg);
        this.screen.render();
    }

    updateStatus() {
        const providers = providerManager.getAllProviders();
        const data = providers.map(p => [
            p.name,
            p.status,
            providerManager.usage[p.id].requestsToday.toString()
        ]);

        this.statusTable.setData({
            headers: ['Provider', 'Status', 'Today'],
            data: data
        });

        // Update usage chart (simplified)
        // In a real app we'd track history. For now just shift random data or 0
        // this.usageData.y.shift();
        // this.usageData.y.push(Math.floor(Math.random() * 10)); // Mock
        // this.usageLine.setData([this.usageData]);

        this.screen.render();
    }

    startUpdateLoop() {
        setInterval(() => {
            this.updateStatus();
        }, 1000);
    }
}

export default new TUI();
