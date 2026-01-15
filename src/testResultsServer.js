import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// API endpoint to run tests
app.get('/api/run-tests', async (req, res) => {
    exec('npm run test', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        const results = parseTestOutput(stdout + stderr);
        res.json(results);
    });
});

function parseTestOutput(output) {
    const results = [];
    const lines = output.split('\n');

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Parse each test line
    lines.forEach(line => {
        if (line.startsWith('Testing ')) {
            const match = line.match(/Testing (.+?)\.\.\. (PASS|FAIL|WARNING)(.*)/);
            if (match) {
                const [, provider, status, message] = match;
                const testResult = {
                    name: provider,
                    status: status.toLowerCase()
                };

                if (status === 'PASS') {
                    passed++;
                } else if (status === 'FAIL') {
                    failed++;
                    testResult.status = 'fail';
                } else if (status === 'WARNING') {
                    warnings++;
                    testResult.status = 'warning';
                }

                // Check for additional message on next lines
                const messageMatch = message.match(/: (.+)/);
                if (messageMatch) {
                    testResult.message = messageMatch[1].trim();
                }

                results.push(testResult);
            }
        }
    });

    // Look for multi-line messages (warnings/errors)
    let currentProvider = null;
    lines.forEach((line, index) => {
        if (line.startsWith('Testing ')) {
            const match = line.match(/Testing (.+?)\.\.\./);
            if (match) {
                currentProvider = match[1];
            }
        } else if (currentProvider && line.trim().startsWith('  ')) {
            // This is a continuation of the message
            const result = results.find(r => r.name === currentProvider);
            if (result && (result.status === 'warning' || result.status === 'fail')) {
                if (!result.message) {
                    result.message = line.trim();
                } else {
                    result.message += ' ' + line.trim();
                }
            }
        }
    });

    return {
        results,
        stats: {
            total: results.length,
            passed,
            warnings,
            failed
        }
    };
}

app.listen(PORT, () => {
    console.log(`\n🎨 Test Results Viewer running at:`);
    console.log(`   http://localhost:${PORT}/test-results-viewer.html\n`);
});
