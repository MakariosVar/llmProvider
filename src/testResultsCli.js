#!/usr/bin/env node

import chalk from 'chalk';
import { spawn } from 'child_process';
import blessed from 'blessed';
import providerManager from './providerManager.js';
import config from './config.js';

// Box drawing characters
const chars = {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    teeDown: '┬',
    teeUp: '┴',
    teeLeft: '┤',
    teeRight: '├'
};

function printHeader() {
    const title = '🚀 LLM Provider Test Results';
    const subtitle = 'Real-time health check status';

    console.log('\n');
    console.log(chalk.bold.magenta(title));
    console.log(chalk.cyan(subtitle));
    console.log(chalk.gray('─'.repeat(60)));
    console.log('');
}

function printStats(stats) {
    const width = 14;

    // Top border
    console.log(
        chars.topLeft +
        chars.horizontal.repeat(width) + chars.teeDown +
        chars.horizontal.repeat(width) + chars.teeDown +
        chars.horizontal.repeat(width) + chars.teeDown +
        chars.horizontal.repeat(width) +
        chars.topRight
    );

    // Labels
    console.log(
        chars.vertical +
        chalk.bold(' Total Tests  ') + chars.vertical +
        chalk.bold('   Passing    ') + chars.vertical +
        chalk.bold('   Warnings   ') + chars.vertical +
        chalk.bold('    Failed    ') +
        chars.vertical
    );

    // Middle border
    console.log(
        chars.teeRight +
        chars.horizontal.repeat(width) + chars.cross +
        chars.horizontal.repeat(width) + chars.cross +
        chars.horizontal.repeat(width) + chars.cross +
        chars.horizontal.repeat(width) +
        chars.teeLeft
    );

    // Values
    const totalStr = String(stats.total).padStart(6);
    const passedStr = String(stats.passed).padStart(6);
    const warningsStr = String(stats.warnings).padStart(6);
    const failedStr = String(stats.failed).padStart(6);

    console.log(
        chars.vertical +
        chalk.bold.magenta(`      ${totalStr}  `) + chars.vertical +
        chalk.bold.green(`      ${passedStr}  `) + chars.vertical +
        chalk.bold.yellow(`      ${warningsStr}  `) + chars.vertical +
        chalk.bold.red(`      ${failedStr}  `) +
        chars.vertical
    );

    // Bottom border
    console.log(
        chars.bottomLeft +
        chars.horizontal.repeat(width) + chars.teeUp +
        chars.horizontal.repeat(width) + chars.teeUp +
        chars.horizontal.repeat(width) + chars.teeUp +
        chars.horizontal.repeat(width) +
        chars.bottomRight
    );

    console.log('');
}

function printProviderResult(name, status, message = null) {
    let icon, statusText, statusColor;

    switch (status) {
        case 'pass':
            icon = '✓';
            statusText = 'PASS';
            statusColor = chalk.green;
            break;
        case 'warning':
            icon = '⚠';
            statusText = 'WARN';
            statusColor = chalk.yellow;
            break;
        case 'fail':
            icon = '✗';
            statusText = 'FAIL';
            statusColor = chalk.red;
            break;
        default:
            icon = '○';
            statusText = '----';
            statusColor = chalk.gray;
    }

    const statusBadge = statusColor.bold(`[${statusText}]`);
    const providerName = chalk.white.bold(name.padEnd(30));

    console.log(`  ${statusColor(icon)} ${statusBadge} ${providerName}`);

    if (message) {
        const indent = '        ';
        const maxWidth = 70;
        const words = message.split(' ');
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length > maxWidth) {
                console.log(indent + chalk.gray.italic(currentLine.trim()));
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });

        if (currentLine.trim()) {
            console.log(indent + chalk.gray.italic(currentLine.trim()));
        }
        console.log('');
    }
}

function parseTestOutput(output) {
    const results = [];
    const lines = output.split('\n');

    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let currentProvider = null;
    let currentMessage = null;

    lines.forEach((line, index) => {
        if (line.startsWith('Testing ')) {
            // Save previous result if exists
            if (currentProvider) {
                results.push({
                    name: currentProvider.name,
                    status: currentProvider.status,
                    message: currentMessage
                });
                currentMessage = null;
            }

            const match = line.match(/Testing (.+?)\.\.\. (PASS|FAIL|WARNING)(.*)/);
            if (match) {
                const [, provider, status, extraMessage] = match;
                const testStatus = status.toLowerCase();

                currentProvider = {
                    name: provider,
                    status: testStatus === 'fail' ? 'fail' : testStatus
                };

                if (status === 'PASS') {
                    passed++;
                } else if (status === 'FAIL') {
                    failed++;
                } else if (status === 'WARNING') {
                    warnings++;
                }

                // Check for inline message
                const messageMatch = extraMessage.match(/: (.+)/);
                if (messageMatch) {
                    currentMessage = messageMatch[1].trim();
                }
            }
        } else if (currentProvider && line.trim().startsWith('  ')) {
            // This is a continuation of the message
            if (!currentMessage) {
                currentMessage = line.trim();
            } else {
                currentMessage += ' ' + line.trim();
            }
        }
    });

    // Don't forget the last provider
    if (currentProvider) {
        results.push({
            name: currentProvider.name,
            status: currentProvider.status,
            message: currentMessage
        });
    }

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

function selectProviderWithTui() {
    return new Promise((resolve) => {
        const screen = blessed.screen({ smartCSR: true, title: 'Select Provider to Test' });

        const box = blessed.box({
            parent: screen,
            top: 'center',
            left: 'center',
            width: '60%',
            height: '60%',
            border: { type: 'line' },
            style: { border: { fg: 'cyan' } },
            label: ' Select provider to run (Enter to choose, Esc to cancel) '
        });

        const list = blessed.list({
            parent: box,
            top: 1,
            left: 1,
            width: '95%',
            height: '85%',
            keys: true,
            vi: true,
            mouse: true,
            interactive: true,
            style: {
                selected: { bg: 'blue', fg: 'white' },
                item: { fg: 'white' }
            },
            items: []
        });

        // Build list items: merge providerManager + config providers (All + provider ids (display name))
        const pmProviders = providerManager.getAllProviders() || [];
        const cfgProviders = (config && config.providers) ? config.providers : {};

        const items = ['All'];
        const seenIds = new Set();

        // Add providers from providerManager first (preferred source)
        pmProviders.forEach(p => {
            const id = p.id || (p.name ? p.name.toLowerCase().replace(/\s+/g, '_') : null);
            const name = p.name || id || String(p);
            if (id) {
                items.push(`${name}:::${id}`);
                seenIds.add(id);
            }
        });

        // Add any providers declared in config that weren't present in providerManager
        Object.keys(cfgProviders).forEach(id => {
            if (seenIds.has(id)) return;
            const p = cfgProviders[id];
            const name = (p && p.name) ? p.name : id;
            items.push(`${name}:::${id}`);
            seenIds.add(id);
        });

        list.setItems(items.map(i => i.includes(':::') ? i.split(':::')[0] : i));

        list.select(0);
        list.focus();

        screen.key(['escape', 'q', 'C-c'], function () {
            screen.destroy();
            resolve(null); // signal cancel
        });

        list.on('select', function (item, idx) {
            const raw = items[idx];
            let chosen = null;
            if (raw === 'All') chosen = 'all';
            else chosen = raw.split(':::')[1];
            screen.destroy();
            resolve(chosen);
        });

        screen.render();
    });
}

async function main() {
    try {
        printHeader();

        // Show a small TUI to pick which provider to test (All + providers)
        const chosen = await selectProviderWithTui();

        console.log(chalk.cyan('Running tests (streaming)...'));
        if (chosen && chosen !== 'all') console.log(chalk.gray(`Selected provider: ${chosen}`));
        console.log('');

        // Spawn the raw test runner so we can stream output line-by-line
        // Use npm run test:raw to be explicit about the raw runner
        const spawnArgs = ['run', 'test:raw'];
        if (chosen && chosen !== 'all') spawnArgs.push('--', `--provider=${chosen}`);
        const runner = spawn('npm', spawnArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        let buffer = '';
        const incrementalResults = [];
        let stats = { total: 0, passed: 0, warnings: 0, failed: 0 };

        let currentProvider = null;

        function handleLine(line) {
            // Parse the new format:
            // Testing Google Gemini:
            //   gemini-2.5-pro... PASS
            //   gemini-2.5-flash... WARNING: Rate limited

            // Check for provider header (e.g., "Testing Google Gemini:")
            if (line.startsWith('Testing ') && line.trim().endsWith(':')) {
                const providerName = line.replace('Testing ', '').replace(':', '').trim();
                currentProvider = providerName;
                // Display the provider header
                console.log(chalk.bold.cyan(`\n${providerName}:`));
                return;
            }

            // Check for model results (indented with "  ")
            if (line.startsWith('  ') && currentProvider) {
                // Format: "  model-name (type)... PASS (responseTime ms)" or "  model-name... WARNING (responseTime ms): message"
                const match = line.trim().match(/^(.+?)\s*\((text|image)\)\.\.\.\s*(PASS|FAIL|WARNING)\s*(?:\((.+?)\))?(.*)$/);
                if (match) {
                    const [, modelName, type, statusRaw, time, extra] = match;
                    const status = statusRaw.toLowerCase();
                    const responseTime = time ? time.trim() : null;

                    // Count
                    stats.total++;
                    if (status === 'pass') stats.passed++;
                    if (status === 'warning') stats.warnings++;
                    if (status === 'fail') stats.failed++;

                    // Extract message if present
                    const messageMatch = extra.match(/:\s*(.+)/);
                    const message = messageMatch ? messageMatch[1].trim() : null;

                    // Full name for display: Provider / Model
                    const fullName = `${currentProvider} / ${modelName}`;
                    const result = { name: fullName, status, message, responseTime };
                    incrementalResults.push(result);

                    const timeDisplay = responseTime ? chalk.gray(` (${responseTime})`) : '';

                    // Print immediately
                    if (status === 'pass') {
                        console.log(chalk.green.bold(`  ✓ ${modelName}${timeDisplay} — PASS`));
                    } else if (status === 'warning') {
                        console.log(chalk.yellow.bold(`  ⚠ ${modelName}${timeDisplay} — WARNING`));
                        if (message) console.log('        ' + chalk.gray.italic(message));
                    } else {
                        console.log(chalk.red.bold(`  ✗ ${modelName}${timeDisplay} — FAIL`));
                        if (message) console.log('        ' + chalk.gray.italic(message));
                    }
                }
                return;
            }

            // Handle old format too for backwards compatibility: "Testing Provider... PASS"
            if (line.startsWith('Testing ') && !line.trim().endsWith(':')) {
                const match = line.match(/Testing (.+?)\.\.\.\s*(PASS|FAIL|WARNING)\s*(?:\((.+?)\))?(.*)/);
                if (match) {
                    const [, provider, statusRaw, time, extra] = match;
                    const status = statusRaw.toLowerCase();
                    const responseTime = time ? time.trim() : null;

                    stats.total++;
                    if (status === 'pass') stats.passed++;
                    if (status === 'warning') stats.warnings++;
                    if (status === 'fail') stats.failed++;

                    const messageMatch = extra.match(/:\s*(.+)/);
                    const message = messageMatch ? messageMatch[1].trim() : null;
                    const result = { name: provider, status, message, responseTime };
                    incrementalResults.push(result);

                    const timeDisplay = responseTime ? chalk.gray(` (${responseTime})`) : '';

                    if (status === 'pass') console.log(chalk.green.bold(`✓ ${provider}${timeDisplay} — PASS`));
                    else if (status === 'warning') {
                        console.log(chalk.yellow.bold(`⚠ ${provider}${timeDisplay} — WARNING`));
                        if (message) console.log('        ' + chalk.gray.italic(message));
                    } else {
                        console.log(chalk.red.bold(`✗ ${provider}${timeDisplay} — FAIL`));
                        if (message) console.log('        ' + chalk.gray.italic(message));
                    }
                }
                return;
            }

            // Handle continuation/detail lines (4+ spaces indent)
            if (line.startsWith('    ') && incrementalResults.length > 0) {
                const cont = line.trim();
                const last = incrementalResults[incrementalResults.length - 1];
                if (last && cont) {
                    if (!last.message) last.message = cont;
                    else last.message += ' ' + cont;
                    console.log('        ' + chalk.gray.italic(cont));
                }
            }
        }

        runner.stdout.on('data', (chunk) => {
            buffer += chunk.toString();
            let idx;
            while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).replace(/\r$/, '');
                buffer = buffer.slice(idx + 1);
                handleLine(line);
            }
        });

        runner.stderr.on('data', (chunk) => {
            // Also process stderr lines
            buffer += chunk.toString();
            let idx;
            while ((idx = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, idx).replace(/\r$/, '');
                buffer = buffer.slice(idx + 1);
                handleLine(line);
            }
        });

        runner.on('close', (code) => {
            console.log('');
            // Print final stats box
            printStats(stats);

            if (stats.failed === 0 && stats.warnings === 0) {
                console.log(chalk.green.bold(`\n🎉 All ${stats.total} tests passed!\n`));
            } else if (stats.failed === 0) {
                console.log(chalk.yellow.bold(`\n✓ All tests completed with ${stats.warnings} warning(s)\n`));
            } else {
                console.log(chalk.red.bold(`\n✗ ${stats.failed} test(s) failed\n`));
            }
            process.exit(code);
        });

    } catch (error) {
        console.error(chalk.red.bold('Error running tests:'), error.message);
        process.exit(1);
    }
}

main();
