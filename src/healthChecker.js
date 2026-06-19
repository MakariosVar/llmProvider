import axios from 'axios';
import providerManager from './providerManager.js';

class HealthChecker {
    constructor() {
        this.checkInterval = 60000; // 1 minute
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.checkAll();
        this.interval = setInterval(() => this.checkAll(), this.checkInterval);
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    async checkAll(force = false) {
        const providers = providerManager.getAllProviders();
        for (const provider of providers) {
            await this.checkProvider(provider, force);
        }
    }

    async checkProvider(provider, force = false) {
        // Skip if no key provided (unless it's Ollama or doesn't need one)
        if (!provider.key && provider.id !== 'ollama' && provider.id !== 'openrouter' && provider.id !== 'apifreellm' && provider.id !== 'pollinations') {
            if (provider.id !== 'ollama' && provider.id !== 'apifreellm' && !provider.key) {
                providerManager.updateStatus(provider.id, 'unconfigured');
                return;
            }
        }

        // Specific check for Ollama
        if (provider.id === 'ollama') {
            try {
                // Check if Ollama is running (health check)
                await axios.get(`${provider.host}/`);

                // Get models
                const response = await axios.get(`${provider.host}/api/tags`);
                if (response.data && response.data.models && response.data.models.length > 0) {
                    provider.models = response.data.models.map(m => m.name);
                    // Verify actual model inference, not just HTTP connectivity
                    try {
                        const orchestrator = (await import('./orchestrator.js')).default;
                        await orchestrator.callProvider(
                            provider, 'Respond with a brief confirmation.',
                            'You are a helpful assistant.', 0.7, provider.models[0], 'text'
                        );
                        providerManager.updateStatus(provider.id, 'online');
                    } catch (inferError) {
                        const isConnError = inferError.code === 'ECONNREFUSED' ||
                            inferError.code === 'ETIMEDOUT' ||
                            inferError.code === 'ENOTFOUND';
                        if (isConnError) {
                            providerManager.updateStatus(provider.id, 'offline');
                        } else {
                            // Non-connection error means Ollama is running but model has issues
                            providerManager.updateStatus(provider.id, 'online');
                        }
                    }
                } else {
                    providerManager.updateStatus(provider.id, 'error');
                }
            } catch (error) {
                providerManager.updateStatus(provider.id, 'offline');
            }
            return;
        }

        if (force) {
            // Check each model individually
            const models = provider.models || [];
            for (const model of models) {
                await this.checkModel(provider, model, 'text');
            }

            // Check image models
            const imageModels = provider.imageModels || [];
            for (const model of imageModels) {
                await this.checkModel(provider, model, 'image');
            }
        }
    }

    async checkModel(provider, model, type = 'text') {
        try {
            // Use a more realistic test prompt that matches agent usage patterns
            // This helps catch issues that simple "hi" tests might miss
            const orchestrator = (await import('./orchestrator.js')).default;

            // Test with a slightly longer prompt and system prompt to better match real usage
            const testPrompt = type === 'image' ? 'A small white square' : 'Respond with a brief confirmation that you are working.';
            const testSystemPrompt = 'You are a helpful assistant.';
            
            await orchestrator.callProvider(provider, testPrompt, testSystemPrompt, 0.7, model, type);

            providerManager.updateModelStatus(provider.id, model, 'online');
            providerManager.updateStatus(provider.id, 'online');
        } catch (error) {
            // Check for rate limit
            const isRateLimit = error.response?.status === 429 ||
                error.message?.toLowerCase().includes('rate limit') ||
                error.response?.data?.toString().toLowerCase().includes('rate limit');

            // Check for transient errors (don't mark as permanent error)
            const isTransientError = error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                (error.response?.status >= 500 && error.response?.status < 600) ||
                error.message?.toLowerCase().includes('timeout') ||
                error.message?.toLowerCase().includes('network');

            if (isRateLimit) {
                providerManager.markRateLimited(provider.id, model);
            } else if (isTransientError) {
                // Don't mark as error for transient issues - just log
                if (global.logger) {
                    global.logger.warn(`Health check: Transient error for ${provider.id} / ${model}: ${error.message}`);
                } else {
                    console.warn(`Health check: Transient error for ${provider.id} / ${model}: ${error.message}`);
                }
                // Keep status as unknown/previous status
            } else {
                // Only mark as error for permanent issues (4xx, auth, etc.)
                providerManager.updateModelStatus(provider.id, model, 'error', error.message);
            }
        }
    }
}

export default new HealthChecker();
