import providerManager from '../src/providerManager.js';
import orchestrator from '../src/orchestrator.js';
import assert from 'assert';

async function testRateLimitCaching() {
    console.log('Starting Rate Limit Caching Test...');

    // Mock provider
    const providerId = 'test_provider';
    const modelName = 'test_model';

    // Manually inject a test provider into providerManager
    providerManager.providers[providerId] = {
        id: providerId,
        name: 'Test Provider',
        models: [modelName],
        endpoint: 'http://localhost:9999/v1/chat/completions', // Dummy endpoint
        key: 'test_key',
        priority: 1
    };
    providerManager.rateLimits[providerId] = {};
    providerManager.modelStatus[providerId] = {};
    providerManager.modelStatus[providerId][modelName] = {};
    providerManager.usage[providerId] = {
        requestsToday: 0,
        requestsThisMinute: 0,
        lastResetMinute: Date.now(),
        lastResetDay: Date.now()
    };

    // Mock axios (since orchestrator imports it, we can't easily mock it without a library like proxyquire or jest)
    // Instead, we will rely on the fact that the dummy endpoint will fail. 
    // Wait, we need to simulate a 429 error.
    // Since we can't easily mock axios in this simple script without changing the source code or using a mock library,
    // we will test the ProviderManager logic directly, and then test the Orchestrator logic by mocking the callProvider method if possible.

    // 1. Test ProviderManager logic
    console.log('1. Testing ProviderManager logic...');
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), false, 'Should not be rate limited initially');

    providerManager.markRateLimited(providerId, modelName);
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), true, 'Should be rate limited after marking');

    const expiry = providerManager.rateLimits[providerId][modelName];
    assert.ok(expiry > Date.now() + 4 * 60 * 1000, 'Expiry should be ~5 minutes in future');

    providerManager.clearRateLimit(providerId, modelName);
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), false, 'Should not be rate limited after clearing');

    // 2. Test Orchestrator logic (Mocking callProvider)
    console.log('2. Testing Orchestrator logic...');

    // Mock callProvider to throw 429
    const originalCallProvider = orchestrator.callProvider;
    let callCount = 0;

    orchestrator.callProvider = async () => {
        callCount++;
        const error = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        throw error;
    };

    // First call - should fail and mark rate limit
    try {
        await orchestrator.generate({ prompt: 'test', systemPrompt: 'test' });
    } catch (e) {
        // Expected failure
    }

    // Verify it was marked
    // Note: Orchestrator iterates through ALL providers. We need to make sure our test provider is the only one or prioritized.
    // To simplify, we can filter providers in the test.
    // But Orchestrator uses providerManager.getAllProviders().
    // Let's just check if *our* provider was marked.

    // Wait, Orchestrator might try other providers too. 
    // Let's check if our specific provider got marked.
    const isLimited = providerManager.isRateLimited(providerId, modelName);
    // This might fail if Orchestrator didn't pick our test provider first.
    // Let's force our provider to be the only one for this test.
    const originalGetAllProviders = providerManager.getAllProviders;
    providerManager.getAllProviders = () => [providerManager.providers[providerId]];

    // Reset and try again
    providerManager.clearRateLimit(providerId, modelName);
    callCount = 0;

    try {
        await orchestrator.generate({ prompt: 'test', systemPrompt: 'test' });
    } catch (e) {
        console.log('Caught expected error:', e.message);
    }

    assert.strictEqual(callCount, 1, 'Should have called provider once');
    assert.strictEqual(providerManager.isRateLimited(providerId, modelName), true, 'Should be rate limited after 429');

    // Second call - should skip without calling provider
    try {
        await orchestrator.generate({ prompt: 'test', systemPrompt: 'test' });
    } catch (e) {
        console.log('Caught expected error (skipped):', e.message);
    }

    assert.strictEqual(callCount, 1, 'Should NOT have called provider again (cached)');

    // Restore
    orchestrator.callProvider = originalCallProvider;
    providerManager.getAllProviders = originalGetAllProviders;
    delete providerManager.providers[providerId];

    console.log('SUCCESS: Rate limit caching verified.');
}

testRateLimitCaching().catch(console.error);
