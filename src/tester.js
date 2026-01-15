import axios from 'axios';
import providerManager from './providerManager.js';
import orchestrator from './orchestrator.js';
import tui from './tui.js';

class Tester {
    async runStartupTest() {
        tui.log('Starting self-test...');
        const providers = providerManager.getAllProviders();

        for (const provider of providers) {
            tui.log(`Testing ${provider.name}...`);
            try {
                // We can't really "test" without consuming quota or risking errors if keys are bad.
                // But we can try a very simple prompt if the user wants "wrapped execute test".
                // "when a server start i want to 'wraped' execute the test to test all the set models"

                // We'll try to generate "hi"
                // But we need to bypass the orchestrator's selection logic to test SPECIFIC provider.
                // So we use orchestrator.callProvider directly.

                if (!provider.key && provider.id !== 'ollama') {
                    tui.log(`Skipping ${provider.name} (no key)`);
                    providerManager.updateStatus(provider.id, 'unconfigured');
                    continue;
                }

                if (provider.id === 'ollama') {
                    try {
                        const response = await axios.get(`${provider.host}/`);
                        if (response.status === 200) {
                            tui.log(`[PASS] ${provider.name}`);
                            providerManager.updateStatus(provider.id, 'online');
                        } else {
                            throw new Error(`Status ${response.status}`);
                        }
                    } catch (error) {
                        tui.log(`[FAIL] ${provider.name}: ${error.message}`);
                        providerManager.updateStatus(provider.id, 'error');
                    }
                    continue;
                }

                const response = await orchestrator.callProvider(provider, 'hi', null, 0.7);
                if (response) {
                    tui.log(`[PASS] ${provider.name}`);
                    providerManager.updateStatus(provider.id, 'online');
                } else {
                    throw new Error('Empty response');
                }
            } catch (error) {
                tui.log(`[FAIL] ${provider.name}: ${error.message}`);
                providerManager.updateStatus(provider.id, 'error');
            }
        }
        tui.log('Self-test complete.');
    }
}

export default new Tester();
