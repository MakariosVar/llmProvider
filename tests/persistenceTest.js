import providerManager from '../src/providerManager.js';
import statusPersistence from '../src/statusPersistence.js';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const DB_FILE = 'status.db';

async function testPersistence() {
    console.log('Starting SQLite Persistence Test...');

    const providerId = 'test_provider_sqlite';
    const modelName = 'test_model_sqlite';

    // Mock provider
    providerManager.providers[providerId] = {
        id: providerId,
        name: 'Test Provider SQLite',
        models: [modelName],
        priority: 1
    };
    providerManager.rateLimits[providerId] = {};
    providerManager.modelStatus[providerId] = {};
    providerManager.modelStatus[providerId][modelName] = { status: 'unknown' };

    // 1. Test Saving
    console.log('1. Testing Save to SQLite...');
    providerManager.markRateLimited(providerId, modelName);

    // Check memory
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), true, 'Should be rate limited in memory');

    // Check SQLite
    const row = statusPersistence.get(providerId, modelName);
    assert.ok(row, 'Data should be in SQLite');
    assert.strictEqual(row.status, 'error', 'Status should be error');
    assert.ok(row.error.includes('Rate limited'), 'Error should be rate limit');

    // 2. Test Loading (Simulate restart)
    console.log('2. Testing Load from SQLite...');
    // Clear memory
    delete providerManager.rateLimits[providerId][modelName];
    providerManager.modelStatus[providerId][modelName] = { status: 'unknown' };

    // isRateLimited checks persistence
    const isLimited = providerManager.isRateLimited(providerId, modelName);
    assert.strictEqual(isLimited, true, 'Should be rate limited from SQLite persistence');

    // 3. Test Expiration
    console.log('3. Testing Expiration...');
    // Manually update SQLite record to make it old
    const oldTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    statusPersistence.db.prepare('UPDATE model_status SET last_updated = ? WHERE provider_id = ? AND model_name = ?')
        .run(oldTime, providerId, modelName);

    const isLimitedExpired = providerManager.isRateLimited(providerId, modelName);
    assert.strictEqual(isLimitedExpired, false, 'Should NOT be rate limited after expiration');

    console.log('SUCCESS: SQLite Persistence verified.');
    
    // Cleanup test data
    statusPersistence.db.prepare('DELETE FROM model_status WHERE provider_id = ?').run(providerId);
}

testPersistence().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
