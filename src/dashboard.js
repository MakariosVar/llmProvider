import blessed from 'blessed';
import contrib from 'blessed-contrib';
import providerManager from './providerManager.js';
import statusPersistence from './statusPersistence.js';
import healthChecker from './healthChecker.js';
import config from './config.js';
import orchestrator from './orchestrator.js';

// ──────────────────────────────────────────────
// Log ring buffer — intercepts console output
// ──────────────────────────────────────────────
const MAX_LOG = 500;
const logBuffer = [];
let logSubscribers = [];

function pushLog(msg, level) {
  const entry = { time: new Date().toLocaleTimeString(), msg, level };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG) logBuffer.shift();
  logSubscribers.forEach(fn => fn(entry));
}

function subscribeLog(fn) {
  logSubscribers.push(fn);
  return () => { logSubscribers = logSubscribers.filter(f => f !== fn); };
}

function interceptConsole() {
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = (...args) => pushLog(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' '), 'info');
  console.error = (...args) => pushLog(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' '), 'error');
  console.warn = (...args) => pushLog(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)).join(' '), 'warn');
  return orig;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const fmtDur = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
};

const fmtNum = n => (n || 0).toLocaleString();

const statusIcon = status => {
  if (status === 'online') return '{green-fg}●{/green-fg}';
  if (status === 'offline') return '{red-fg}✕{/red-fg}';
  if (status === 'rate_limited') return '{yellow-fg}⚠{/yellow-fg}';
  return '{cyan-fg}○{/cyan-fg}';
};

const statusColor = status => {
  if (status === 'online') return 'green';
  if (status === 'offline') return 'red';
  if (status === 'rate_limited') return 'yellow';
  return 'cyan';
};

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
export function startDashboard() {
  process.stderr.write('[dashboard] starting...\n');
  interceptConsole();

  const screen = blessed.screen({
    smartCSR: true,
    title: 'LLM Provider Dashboard',
    dockBorders: true,
    fullUnicode: true,
    autoPadding: true,
    cursor: { artificial: true, blink: true },
  });

  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  // ─── Provider Status (rows 0-7, cols 0-7) ───
  const providerBox = grid.set(0, 0, 8, 7, blessed.box, {
    label: ' Provider Status ',
    tags: true,
    border: { type: 'line', fg: 'cyan' },
    style: { fg: 'white' },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '│', inverse: true },
    mouse: true,
    padding: { left: 1, right: 1 },
  });

  // ─── Usage Table (rows 0-3, cols 7-11) ───
  const usageTable = grid.set(0, 7, 4, 5, contrib.table, {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '│', inverse: true },
    mouse: true,
    label: ' Usage Today ',
    border: { type: 'line', fg: 'green' },
    columnSpacing: 2,
    columnWidth: [14, 6, 8, 8, 6],
  });

  // ─── Stats Panel (rows 4-7, cols 7-11) ───
  const statsBox = grid.set(4, 7, 4, 5, blessed.box, {
    label: ' Performance ',
    tags: true,
    border: { type: 'line', fg: 'yellow' },
    style: { fg: 'white' },
    padding: { left: 1, right: 1 },
  });

  // ─── Live Log (rows 8-10, cols 0-12) ───
  const logBox = grid.set(8, 0, 3, 12, contrib.log, {
    fg: 'white',
    selectedFg: 'white',
    label: ' Live Log ',
    border: { type: 'line', fg: 'magenta' },
    scrollback: 500,
    mouse: true,
  });

  const BASE_STATUS = ' {magenta-fg}[q]{/magenta-fg}uit  {magenta-fg}[r]{/magenta-fg}escan  {magenta-fg}[t]{/magenta-fg}unnel  {magenta-fg}[c]{/magenta-fg}lear log  {magenta-fg}[d]{/magenta-fg}ebug';

  // ─── Status Bar (row 11, cols 0-12) ───
  const statusBar = grid.set(11, 0, 1, 12, blessed.box, {
    tags: true,
    style: { fg: 'white', bg: 'black' },
    padding: { left: 1, right: 1 },
    content: BASE_STATUS,
  });

  // ─── Data refresh ───
  let refreshTimer = null;
  let serverStart = Date.now();

  // ─── Tunnel state ───
  let tunnelInstance = null;
  let tunnelUrl = null;

  function makeProviderContent(providers) {
    const lines = [];
    for (const p of providers) {
      const icon = statusIcon(p.status);
      const color = statusColor(p.status);
      const lat = p.latency > 0 ? `${Math.round(p.latency)}ms` : '---';
      const models = (p.models || []).slice(0, 3).join(', ');
      const extra = p.models && p.models.length > 3 ? ` +${p.models.length - 3}` : '';
      lines.push(` ${icon} {${color}-fg}${(p.name || p.id).padEnd(14)}{/${color}-fg} ${lat.padStart(7)}`);
      lines.push(`   models: ${models}${extra}`);
      lines.push('');
    }
    if (lines.length === 0) lines.push(' (no providers loaded)');
    return lines.join('\n');
  }

  function makeUsageData(providers, providerStats) {
    const headers = ['Provider', 'Reqs', 'Input', 'Output', 'Used'];
    const rows = [];
    for (const p of providers) {
      const usage = p.usage || { requestsToday: 0 };
      const db = providerStats && providerStats.find(s => s.provider_id === p.id);
      // Live used% from response headers (first model with rate limit data)
      let usedPct = '—';
      if (p.liveRateLimits) {
        for (const model of Object.keys(p.liveRateLimits)) {
          const rl = p.liveRateLimits[model];
          if (rl.requestsLimit && rl.requestsLimit > 0) {
            const used = Math.max(0, rl.requestsLimit - (rl.requestsRemaining || 0));
            usedPct = Math.round((used / rl.requestsLimit) * 100) + '%';
            break;
          }
        }
      }
      rows.push([
        (p.name || p.id).slice(0, 12),
        fmtNum(usage.requestsToday),
        db ? fmtNum(db.total_input_tokens || 0) : '—',
        db ? fmtNum(db.total_output_tokens || 0) : '—',
        usedPct,
      ]);
    }
    return { headers, data: rows };
  }

  function makeStatsContent(stats, providers, nextModel) {
    const s = stats?.summary || {};
    const total = s.totalRequests || 0;
    const success = s.successRequests || 0;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '---';
    const avgL = s.avgLatency ? `${s.avgLatency}ms` : '---';
    const mem = process.memoryUsage();
    const memMB = Math.round(mem.rss / 1024 / 1024);

    // Requests/minute (rough: from current minute counters)
    let rpm = 0;
    for (const p of providers) {
      rpm += (p.usage?.requestsThisMinute || 0);
    }

    const nextLine = nextModel && nextModel.provider
      ? ` {bold}Next model:{/bold}      {green-fg}${nextModel.provider}{/green-fg} / ${nextModel.model}`
      : ` {bold}Next model:{/bold}      {red-fg}none{/red-fg}`;

    return [
      ` {bold}Requests/min:{/bold}  {cyan-fg}${rpm}{/cyan-fg}`,
      ` {bold}Avg latency:{/bold}   {yellow-fg}${avgL}{/yellow-fg}`,
      ` {bold}Success rate:{/bold}  {green-fg}${rate}%{/green-fg}`,
      ` {bold}Memory:{/bold}        {magenta-fg}${memMB}MB{/magenta-fg}`,
      ` {bold}Uptime:{/bold}        ${fmtDur((Date.now() - serverStart) / 1000)}`,
      nextLine,
    ].join('\n');
  }

  function restoreStatusBar() {
    const suffix = tunnelUrl ? `  {green-fg}● Tunnel: ${tunnelUrl}{/green-fg}` : '';
    statusBar.setContent(BASE_STATUS + suffix);
    screen.render();
  }

  async function startTunnel() {
    try {
      const localtunnel = (await import('localtunnel')).default;
      const port = config.port || 3000;
      tunnelInstance = await localtunnel({ port });
      tunnelUrl = tunnelInstance.url;
      pushLog(`Tunnel opened: ${tunnelUrl}`, 'info');
      tunnelInstance.on('close', () => {
        pushLog('Tunnel closed', 'info');
        tunnelUrl = null;
        tunnelInstance = null;
        restoreStatusBar();
      });
      statusBar.setContent(` {green-fg}● Tunnel: ${tunnelUrl}{/green-fg}  {magenta-fg}[t]{/magenta-fg} close`);
      screen.render();
    } catch (e) {
      pushLog(`Tunnel failed: ${e.message}`, 'error');
      tunnelUrl = null;
      tunnelInstance = null;
      restoreStatusBar();
    }
  }

  async function stopTunnel() {
    if (tunnelInstance) {
      tunnelInstance.close();
      tunnelInstance = null;
      tunnelUrl = null;
      pushLog('Tunnel closed', 'info');
      restoreStatusBar();
    }
  }

  async function refresh() {
    try {
      const providers = providerManager.getAllProviders();
      const stats = statusPersistence.getStats();
      let nextModel = null;
      try {
        nextModel = await orchestrator.findNextCandidate();
      } catch (_) {}

      // Provider status
      providerBox.setContent(makeProviderContent(providers));

      // Usage table
      const ud = makeUsageData(providers, stats?.providers);
      usageTable.setData(ud);

      // Stats
      statsBox.setContent(makeStatsContent(stats, providers, nextModel));

      screen.render();
    } catch (e) {
      // ignore refresh errors
    }
  }

  // ─── Log subscription ───
  const unsubLog = subscribeLog(entry => {
    try {
      const tag = entry.level === 'error' ? '{red-fg}' : entry.level === 'warn' ? '{yellow-fg}' : '';
      const close = entry.level === 'error' || entry.level === 'warn' ? '{/}' : '';
      logBox.log(`[${entry.time}] ${tag}${entry.msg}${close}`);
      screen.render();
    } catch (_) {}
  });

  // ─── Seed existing logs ───
  for (const entry of logBuffer) {
    const tag = entry.level === 'error' ? '{red-fg}' : entry.level === 'warn' ? '{yellow-fg}' : '';
    const close = entry.level === 'error' || entry.level === 'warn' ? '{/}' : '';
    logBox.log(`[${entry.time}] ${tag}${entry.msg}${close}`);
  }

  // ─── Key bindings ───
  screen.key(['q', 'Q'], () => {
    clearInterval(refreshTimer);
    unsubLog();
    if (tunnelInstance) tunnelInstance.close();
    screen.destroy();
    process.exit(0);
  });

  screen.key(['r', 'R'], () => {
    statusBar.setContent(' Running health check... ');
    screen.render();
    healthChecker.checkAll(true).catch(() => {}).finally(() => {
      setTimeout(refresh, 500);
      restoreStatusBar();
    });
  });

  screen.key(['c', 'C'], () => {
    logBox.clear();
    screen.render();
  });

  screen.key(['d', 'D'], () => {
    // Toggle debug info in status bar
    const mem = process.memoryUsage();
    const heap = Math.round(mem.heapUsed / 1024 / 1024);
    const rss = Math.round(mem.rss / 1024 / 1024);
    const dbProviders = statusPersistence.getStats()?.providers?.length || 0;
    const dbModels = statusPersistence.getStats()?.models?.length || 0;
    statusBar.setContent(
      ` Heap: ${heap}MB  RSS: ${rss}MB  DB providers: ${dbProviders}  DB models: ${dbModels} `
    );
    screen.render();
    setTimeout(restoreStatusBar, 5000);
  });

  screen.key(['t', 'T'], () => {
    if (tunnelInstance) {
      stopTunnel();
    } else {
      startTunnel();
    }
  });

  // ─── Start refresh loop ───
  refresh();
  refreshTimer = setInterval(refresh, 2000);

  screen.render();
}
