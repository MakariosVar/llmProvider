import fs from 'fs';
import readline from 'readline';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', 'status.db');

const PROVIDERS = [
  {
    id: 'zai_org',
    name: 'Z.ai',
    models: ['glm-4.5-Flash', 'glm-4.7-Flash'],
    weight: 15
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'],
    weight: 20
  },
  {
    id: 'nvidia_nim',
    name: 'Nvidia NIM',
    models: ['minimaxai/minimax-m3', 'nvidia/nemotron-3-super-120b-a12b', 'nvidia/nemotron-3-ultra-550b-a55b'],
    weight: 10
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    models: ['gpt-oss-120b', 'zai-glm-4.7'],
    weight: 8
  },
  {
    id: 'mistral_ai',
    name: 'Mistral AI',
    models: ['mistral-small-latest', 'open-mistral-nemo'],
    weight: 12
  },
  {
    id: 'github',
    name: 'GitHub Models',
    models: ['gpt-4o', 'gpt-4o-mini', 'deepseek-r1', 'phi-4-mini-instruct', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'],
    weight: 18
  },
  {
    id: 'google_gemini',
    name: 'Google Gemini',
    models: ['gemini-3.5-flash', 'gemini-3.1-flash-lite'],
    weight: 5
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    models: ['deepseek-ai/DeepSeek-V4-Flash', 'Qwen/Qwen2.5-7B-Instruct'],
    weight: 6
  },
  {
    id: 'cohere',
    name: 'Cohere',
    models: ['command-a-plus-05-2026', 'command-a-03-2025'],
    weight: 4
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: ['openrouter/auto'],
    weight: 2
  }
];

const TOTAL_REQUESTS = 3500;
const DAYS_BACK = 45;
const IDLE_GAP_COUNT = 20;

const weightedRandom = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const generateTokenCount = (isInput) => {
  if (isInput) {
    return randInt(50, 2500);
  }
  return randInt(20, 4000);
};

const generateLatency = (providerId) => {
  const baseLatencies = {
    zai_org: 1200,
    groq: 400,
    nvidia_nim: 900,
    cerebras: 300,
    mistral_ai: 1100,
    github: 800,
    google_gemini: 600,
    huggingface: 1500,
    cohere: 700,
    openrouter: 1300
  };
  const base = baseLatencies[providerId] || 800;
  const noise = randFloat(-base * 0.4, base * 0.5);
  return clamp(Math.round(base + noise), 50, 6000);
};

const hourWeight = (hour) => {
  if (hour >= 8 && hour <= 12) return 1.0;
  if (hour >= 13 && hour <= 18) return 0.9;
  if (hour >= 19 && hour <= 22) return 0.6;
  if (hour >= 23 || hour <= 5) return 0.1;
  return 0.3;
};

const dayWeight = (dayIndex) => {
  const day = dayIndex % 7;
  return day === 0 || day === 6 ? 0.4 : 1.0;
};

const generateTimestamps = () => {
  const now = Date.now();
  const startTime = now - DAYS_BACK * 24 * 60 * 60 * 1000;
  const range = now - startTime;

  const numPeriods = DAYS_BACK * 24;
  const intervalMs = range / numPeriods;

  const candidates = [];

  for (let period = 0; period < numPeriods; period++) {
    const periodStart = startTime + period * intervalMs;
    const d = new Date(periodStart);
    const hw = hourWeight(d.getHours());
    const dw = dayWeight(d.getDay());

    let numInSlot = Math.round(5 * hw * dw);

    if (numInSlot > 0 && Math.random() < 0.3) {
      numInSlot += randInt(3, 15);
    }

    if (numInSlot === 0 && Math.random() < 0.05) {
      numInSlot = 1;
    }

    for (let i = 0; i < numInSlot; i++) {
      const offset = (i + 1) / (numInSlot + 1);
      const jitter = randFloat(-0.4, 0.4) * intervalMs;
      const ts = periodStart + offset * intervalMs + jitter;
      candidates.push(ts);
    }
  }

  const idleGapMinutes = [30, 45, 60, 90, 120];
  for (let i = 0; i < IDLE_GAP_COUNT; i++) {
    const gapDuration = idleGapMinutes[randInt(0, idleGapMinutes.length - 1)] * 60 * 1000;
    const gapStart = startTime + Math.random() * (range - gapDuration);
    const gapEnd = gapStart + gapDuration;
    for (let j = candidates.length - 1; j >= 0; j--) {
      if (candidates[j] >= gapStart && candidates[j] <= gapEnd) {
        candidates.splice(j, 1);
      }
    }
  }

  candidates.sort((a, b) => a - b);

  while (candidates.length > TOTAL_REQUESTS) {
    const excess = candidates.length - TOTAL_REQUESTS;
    const removeEvery = Math.floor(candidates.length / excess);
    for (let i = candidates.length - 1; i >= 0 && candidates.length > TOTAL_REQUESTS; i -= removeEvery) {
      candidates.splice(i, 1);
    }
  }

  return candidates;
};

const generateStatus = () => Math.random() < 0.88 ? 'success' : 'error';

const main = () => {
  const shouldClear = process.argv.includes('--clear');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    console.error('Start the server first so the DB is created, then run this script.');
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  console.log(`Connected to database: ${DB_PATH}`);

  if (shouldClear) {
    console.log('Clearing existing request_history rows...');
    const cleared = db.prepare('DELETE FROM request_history').run();
    console.log(`Cleared ${cleared.changes} rows`);
  }

  const existingCount = db.prepare('SELECT COUNT(*) as count FROM request_history').get().count;
  if (existingCount > 0 && !shouldClear) {
    console.log(`Database already has ${existingCount} request_history rows.`);
    console.log('Use --clear to remove existing data before seeding, or skip if you want to append.');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Append to existing data? (y/N): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborting.');
        db.close();
        process.exit(0);
      }
      seed(db);
    });
  } else {
    seed(db);
  }
};

const seed = (db) => {
  console.log(`Generating ~${TOTAL_REQUESTS} realistic requests over ${DAYS_BACK} days...`);

  const timestamps = generateTimestamps();
  console.log(`Generated ${timestamps.length} timestamps across ${DAYS_BACK} days`);

  const insert = db.prepare(`
    INSERT INTO request_history (provider_id, model_name, status, latency, input_tokens, output_tokens, type, timestamp, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBatch = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(...row);
    }
  });

  const batchSize = 500;
  let batch = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const provider = weightedRandom(PROVIDERS);
    const model = provider.models[randInt(0, provider.models.length - 1)];
    const status = generateStatus();
    const latency = status === 'success' ? generateLatency(provider.id) : 0;
    const inputTokens = generateTokenCount(true);
    const outputTokens = generateTokenCount(false);
    const errorMessage = status === 'error'
      ? (['rate_limit_exceeded', 'timeout', 'internal_error', 'insufficient_quota'][randInt(0, 3)])
      : null;

    batch.push([
      provider.id,
      model,
      status,
      latency,
      inputTokens,
      outputTokens,
      'text',
      ts,
      errorMessage
    ]);

    if (status === 'success') successCount++;
    else errorCount++;

    if (batch.length >= batchSize) {
      insertBatch(batch);
      batch = [];
      if (i % 1000 === 0) process.stdout.write(`\rInserted ${i + 1}/${timestamps.length}...`);
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
  }

  console.log(`\rInserted ${timestamps.length}/${timestamps.length} rows. Done.`);

  const now = Date.now();
  const minTs = db.prepare('SELECT MIN(timestamp) as ts FROM request_history').get().ts;
  const maxTs = db.prepare('SELECT MAX(timestamp) as ts FROM request_history').get().ts;
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM request_history').get().count;

  const allLastHour = db.prepare(`
    SELECT COUNT(*) as count FROM request_history WHERE timestamp > ?
  `).get(now - 60 * 60 * 1000).count;

  const perProvider = db.prepare(`
    SELECT provider_id, COUNT(*) as count FROM request_history GROUP BY provider_id ORDER BY count DESC
  `).all();

  console.log('\n--- Seed Summary ---');
  console.log(`Total rows:     ${totalCount.toLocaleString()}`);
  console.log(`Date range:     ${new Date(minTs).toISOString().slice(0, 16)} → ${new Date(maxTs).toISOString().slice(0, 16)}`);
  console.log(`Success rate:   ${(successCount / (successCount + errorCount) * 100).toFixed(1)}%`);
  console.log(`Records (1H):   ${allLastHour} (should be low since data is synthetic)`);
  console.log('\nPer provider:');
  for (const p of perProvider) {
    console.log(`  ${p.provider_id.padEnd(16)} ${p.count.toLocaleString().padStart(6)}`);
  }

  const gapsToTest = [
    { interval: 'minute', label: '1H (minute)' },
    { interval: 'hour', label: '24H (hour)' },
    { interval: 'day', label: '7D (day)' },
    { interval: 'month', label: 'Monthly' }
  ];

  console.log('\nVerification queries:');
  for (const { interval, label } of gapsToTest) {
    const dateFormat = interval === 'minute' ? '%Y-%m-%d %H:%M'
      : interval === 'hour' ? '%Y-%m-%d %H:00'
      : interval === 'month' ? '%Y-%m'
      : '%Y-%m-%d';
    const limit = interval === 'minute' ? 60 : interval === 'hour' ? 48 : interval === 'day' ? 60 : 24;
    const rows = db.prepare(`
      SELECT strftime('${dateFormat}', timestamp / 1000, 'unixepoch', 'localtime') as label,
             COUNT(*) as value
      FROM request_history
      GROUP BY label
      ORDER BY label ASC
      LIMIT ${limit}
    `).all();
    const allBuckets = db.prepare(`SELECT COUNT(*) as c FROM (SELECT strftime('${dateFormat}', timestamp / 1000, 'unixepoch', 'localtime') as label FROM request_history GROUP BY label ORDER BY label ASC LIMIT ${limit})`).get().c;
    console.log(`  ${label.padEnd(18)} ${allBuckets} buckets, ${allBuckets > 0 ? 'gap-free' : 'empty'} (will be filled by fillTimeGaps)`);
  }

  db.close();
  console.log('\nDone. Restart the server so the frontend picks up the new data.');
};

main();
