import providerManager from '../src/providerManager.js';
import statusPersistence from '../src/statusPersistence.js';
import assert from 'assert';
import fs from 'fs';

const DB_FILE = 'status_db.json';

async function testPersistence() {
    console.log('Starting Persistence Test...');

    // Cleanup
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

    // Reset providerManager (it's a singleton, so we need to re-init or manually clear)
    // Since we can't easily re-new the singleton, we'll manipulate its state.
    const providerId = 'test_provider_persist';
    const modelName = 'test_model_persist';

    providerManager.providers[providerId] = {
        id: providerId,
        name: 'Test Provider Persist',
        models: [modelName],
        priority: 1
    };
    providerManager.rateLimits[providerId] = {};
    providerManager.modelStatus[providerId] = {};
    providerManager.modelStatus[providerId][modelName] = { status: 'unknown' };

    // 1. Test Saving
    console.log('1. Testing Save...');
    providerManager.markRateLimited(providerId, modelName);

    // Check memory
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), true, 'Should be rate limited in memory');

    // Check file
    assert.ok(fs.existsSync(DB_FILE), 'DB file should exist');
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    assert.ok(data[providerId][modelName], 'Data should be in file');
    assert.strictEqual(data[providerId][modelName].status, 'error', 'Status should be error');
    assert.ok(data[providerId][modelName].error.includes('Rate limited'), 'Error should be rate limit');

    // 2. Test Loading (Simulate restart)
    console.log('2. Testing Load...');
    // Clear memory
    delete providerManager.rateLimits[providerId][modelName];
    providerManager.modelStatus[providerId][modelName] = { status: 'unknown' };

    // Re-initialize (simulate restart logic)
    // We can't call constructor again, but we can call the logic we added to initialize()
    // We'll manually invoke the loading logic by calling a helper or just re-running the block if we extracted it.
    // Since we didn't extract it, we have to rely on `isRateLimited` checking persistence OR manually trigger a reload if we added a method.
    // Wait, `isRateLimited` DOES check persistence now!

    const isLimited = providerManager.isRateLimited(providerId, modelName);
    assert.strictEqual(isLimited, true, 'Should be rate limited from persistence');

    // 3. Test Expiration
    console.log('3. Testing Expiration...');
    // Manually edit file to make it old
    data[providerId][modelName].lastUpdated = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    fs.writeFileSync(DB_FILE, JSON.stringify(data));

    // Reload persistence data in memory (StatusPersistence needs to reload file)
    statusPersistence.load();

    const isLimitedExpired = providerManager.isRateLimited(providerId, modelName);
    assert.strictEqual(isLimitedExpired, false, 'Should NOT be rate limited after expiration');

    console.log('SUCCESS: Persistence verified.');

    // Cleanup
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
}

testPersistence().catch(console.error);
