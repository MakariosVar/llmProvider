// Entry point for the compiled binary.
// Starts the HTTP server then launches the TUI dashboard.

import '../server.js';
import { startDashboard } from './dashboard.js';

// Give the server a moment to bind its port and start health checks
setTimeout(() => {
  process.stderr.write('[cli] starting dashboard...\n');
  try {
    startDashboard();
    process.stderr.write('[cli] dashboard running\n');
  } catch (err) {
    process.stderr.write(`[cli] dashboard error: ${err.stack}\n`);
  }
}, 1500);
