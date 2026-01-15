import axios from 'axios';
import providerManager from './providerManager.js';
import orchestrator from './orchestrator.js';
import healthChecker from './healthChecker.js';

// Simple arg/env parsing to allow running a subset of providers to avoid
// hitting API limits. Usage examples:
//   npm run test:raw -- --provider=replicate
//   PROVIDER=replicate node src/testRunner.js
//   npm run test:raw --provider=replicate  (npm sets npm_config_provider)
function getRequestedProviders() {
    const argv = process.argv.slice(2);
    let providersArg = null;

    for (const a of argv) {
        if (a.startsWith('--provider=')) providersArg = a.split('=')[1];
        if (a.startsWith('--providers=')) providersArg = a.split('=')[1];
        // allow comma separated
    }

    // npm passes `--provider=xxx` as npm_config_provider env var when using `npm run`
    providersArg = providersArg || process.env.PROVIDER || process.env.PROVIDERS || process.env.npm_config_provider;

    if (!providersArg) return null;
    return providersArg.split(',').map(s => s.trim()).filter(Boolean);
}

async function runTests() {
    console.log('Starting Provider Health Check...');

    // Run health checks first to update dynamic configs (e.g. Ollama models)
    await healthChecker.checkAll();

    const requested = getRequestedProviders();
    if (requested && requested.length > 0) {
        console.log('Running tests for provider(s):', requested.join(', '));
    }

    let providers = providerManager.getAllProviders();
    if (requested && requested.length > 0) {
        providers = providers.filter(p => requested.includes(p.id) || requested.includes(p.name));
    }
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let totalModels = 0;

    for (const provider of providers) {
        console.log(`\nTesting ${provider.name}:`);

        // Skip if no key
        if (!provider.key && provider.id !== 'ollama' && provider.id !== 'openrouter' && provider.id !== 'apifreellm') {
            console.log('  SKIPPED (No Key)');
            continue;
        }

        // Special handling for Ollama (just check if service is running)
        if (provider.id === 'ollama') {
            try {
                const response = await axios.get(`${provider.host}/`);
                if (response.status === 200) {
                    console.log('  Service: PASS');
                    passed++;
                    totalModels++;
                } else {
                    throw new Error(`Status ${response.status}`);
                }
            } catch (error) {
                console.log(`  Service: FAIL: ${error.message}`);
                failed++;
                totalModels++;
            }
            continue;
        }

        // Test each model individually
        const models = providerManager.getAllModels(provider.id);
        totalModels += models.length;

        for (const model of models) {
            process.stdout.write(`  ${model}... `);
            try {
                // Simple "hi" test for this specific model
                const response = await orchestrator.callProvider(provider, 'hi', null, 0.7, model);
                if (response) {
                    console.log('PASS');
                    passed++;
                    providerManager.updateModelStatus(provider.id, model, 'online');
                } else {
                    throw new Error('Empty response');
                }
            } catch (error) {
                // Check if it's a rate limit error (429)
                const isRateLimited = error.response?.status === 429 ||
                    error.message?.toLowerCase().includes('rate limit') ||
                    error.response?.data?.toString().toLowerCase().includes('rate limit');

                // Check for cached rate limit
                const isCachedRateLimit = error.message?.includes('Rate limited (cached)');

                // Check if it's a billing/credit issue (402)
                const respData = error.response?.data;
                const respErrorMessage = respData?.detail || respData?.message || respData?.error?.message || '';
                const isBillingIssue = error.response?.status === 402 ||
                    error.message?.toLowerCase().includes('insufficient credit') ||
                    error.message?.toLowerCase().includes('billing') ||
                    respErrorMessage.toString().toLowerCase().includes('credit') ||
                    respErrorMessage.toString().toLowerCase().includes('billing') ||
                    respErrorMessage.toString().toLowerCase().includes('insufficient');

                // Check if it's a quota/limit issue
                const isQuotaIssue = error.message?.toLowerCase().includes('quota exceeded') ||
                    error.message?.toLowerCase().includes('limit exceeded');

                // Check if it's a configuration issue (not a real failure)
                const isConfigIssue = error.message?.includes('configure separately') ||
                    error.message?.includes('requires specific');

                // Special handling for APIFreeLLM 500 errors (often transient or upstream issue)
                const isApiFreeLlm500 = provider.id === 'apifreellm' && error.response?.status === 500;

                if (isRateLimited || isCachedRateLimit || isBillingIssue || isQuotaIssue || isApiFreeLlm500) {
                    const reason = isCachedRateLimit ? 'Rate limited (cached 5m)' :
                        isRateLimited ? 'Rate limited' :
                            isBillingIssue ? 'Insufficient credit/billing issue' :
                                isQuotaIssue ? 'Quota exceeded' :
                                    'Internal server error (upstream)';
                    console.log(`WARNING: ${reason}`);
                    if (error.response && error.response.data) {
                        const errorData = error.response.data;
                        const errorMsg = respErrorMessage || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
                        const display = String(errorMsg).substring(0, 200);
                        console.log(`    ${display}${display.length > 200 ? '...' : ''}`);
                    }
                    warnings++;
                    providerManager.updateModelStatus(provider.id, model, 'error', reason);
                } else if (isConfigIssue) {
                    console.log(`WARNING: ${error.message}`);
                    warnings++;
                    providerManager.updateModelStatus(provider.id, model, 'error', error.message);
                } else {
                    console.log(`FAIL: ${error.message}`);
                    if (error.response && error.response.data) {
                        const errorData = error.response.data;
                        const display = JSON.stringify(errorData).substring(0, 200);
                        console.log(`    ${display}${display.length > 200 ? '...' : ''}`);
                    }
                    failed++;
                    providerManager.updateModelStatus(provider.id, model, 'error', error.message);
                }
            }
        }
    }

    console.log('\n===================================');
    console.log(`Tests Complete.`);
    console.log(`Total Models Tested: ${totalModels}`);
    console.log(`Passed: ${passed}, Failed: ${failed}, Warnings: ${warnings}`);
    console.log('===================================');
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
