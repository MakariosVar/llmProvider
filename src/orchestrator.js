import axios from 'axios';
import http from 'http';
import https from 'https';
import providerManager from './providerManager.js';
import winston from 'winston';
import CircuitBreaker from './circuitBreaker.js';
import { AllProvidersFailedError } from './errors.js';
import chalk from 'chalk';


// Create logger instance for orchestrator
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            const time = chalk.yellow(`[${timestamp}]`);

            const levelColors = {
            debug: chalk.gray,
            info: chalk.cyan,
            warn: chalk.yellow,
            error: chalk.red,
            };

            const lvl = levelColors[level] 
            ? levelColors[level.toLowerCase()](`[${level.toUpperCase()}]`)
            : `[${level.toUpperCase()}]`;


            return `${time} ${lvl} [Orchestrator] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// Initialize circuit breaker
const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,      // 5 failures before opening
    resetTimeout: 60000,       // Try again after 1 minute
    halfOpenAttempts: 3        // 3 successful attempts to close
});

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Configure axios with connection pooling for better performance
const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 50, // Max concurrent requests per host
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 3000
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 3000
});

// Create axios instance with connection pooling
const axiosInstance = axios.create({
    httpAgent,
    httpsAgent,
    timeout: 120000 // 2 minute timeout for long-running requests
});

/**
 * Destroys the HTTP and HTTPS agents.
 * Call this function during graceful shutdown to prevent resource leaks.
 */
export function cleanupHttpAgents() {
    logger.info('Destroying HTTP/HTTPS agents...');
    httpAgent.destroy();
    httpsAgent.destroy();
}

class Orchestrator {
    async generateImage(params) {
        const { prompt } = params;
        let requestedModel = params.model;

        // Get candidates
        let candidates = providerManager.getProvidersByType('image')
            .filter(p => providerManager.canUseProvider(p.id))
            .sort((a, b) => a.priority - b.priority);

        if (requestedModel) {
            candidates = candidates.filter(p => {
                const models = providerManager.getAllModels(p.id, 'image');
                return models.includes(requestedModel);
            });
        }

        if (candidates.length === 0) {
            throw new Error('No available image providers');
        }

        let allErrors = [];

        for (const provider of candidates) {
            if (!circuitBreaker.canAttempt(provider.id)) continue;

            let models = providerManager.getAllModels(provider.id, 'image');
            if (requestedModel) {
                models = models.filter(m => m === requestedModel);
            }

            for (const model of models) {
                if (providerManager.isRateLimited(provider.id, model)) continue;

                try {
                    logger.info(`Trying image provider: ${provider.name}, model: ${model}`);
                    const response = await this.callProvider(provider, prompt, null, 0.7, model, 'image');

                    providerManager.incrementUsage(provider.id);
                    providerManager.updateStatus(provider.id, 'online');
                    providerManager.updateModelStatus(provider.id, model, 'online');
                    providerManager.clearRateLimit(provider.id, model);
                    circuitBreaker.recordSuccess(provider.id);

                    return {
                        provider: provider.name,
                        model: model,
                        imageUrl: response
                    };
                } catch (error) {
                    logger.error(`Image Provider ${provider.name} failed: ${error.message}`);
                    allErrors.push(error);
                    circuitBreaker.recordFailure(provider.id);
                }
            }
        }
        throw new AllProvidersFailedError(allErrors);
    }

    async generate(params) {
        const { prompt, systemPrompt, temperature = 0.7 } = params;
        let requestedModel = params.model;

        // If no explicit model, check if mode is a specific model name (not an abstract mode)
        // If mode is abstract (fast/smart), we typically rely on the provider loop to find the best model,
        // or we could map fast/smart to specific models here if we wanted.
        // For now, only treat mode as model if it looks like a model name.
        if (!requestedModel && params.mode && !['fast', 'smart', 'coding', 'general', 'pending'].includes(params.mode)) {
            requestedModel = params.mode;
        }

        // Get candidates
        let candidates = providerManager.getAllProviders()
            .filter(p => providerManager.canUseProvider(p.id))
            .sort((a, b) => a.priority - b.priority);

        // Filter candidates if a specific model is requested
        if (requestedModel) {
            candidates = candidates.filter(p => p.models && p.models.includes(requestedModel));
        }

        if (candidates.length === 0) {
            // Fallback: If no provider has the exact model, maybe check if we should throw or just try all?
            // For now, if model is specific, we assume the user wants THAT model.
            // But if it's null, we use all.
            if (requestedModel) {
                throw new Error(`No available provider supports model: ${requestedModel}`);
            } else {
                throw new Error('No available providers');
            }
        }

        let lastError = null;
        const allErrors = []; // Array to collect all errors

        for (const provider of candidates) {
            // Check circuit breaker
            if (!circuitBreaker.canAttempt(provider.id)) {
                logger.warn(`Circuit breaker OPEN for ${provider.name} - skipping`);
                allErrors.push(new Error(`Circuit breaker OPEN for ${provider.name}`));
                continue;
            }

            let models = providerManager.getAllModels(provider.id);
            // Filter models if specific model requested
            if (requestedModel) {
                models = models.filter(m => m === requestedModel);
            }

            // Try each model in the provider before moving to the next provider
            for (const model of models) {
                // Check for cached rate limit
                if (providerManager.isRateLimited(provider.id, model)) {
                    logger.debug(`Skipping provider: ${provider.name}, model: ${model} (Rate Limited - Cached)`);
                    continue;
                }

                // Check model status - skip models marked as error (unless it's been a while)
                const modelStatus = providerManager.getModelStatus(provider.id, model);
                if (modelStatus.status === 'error') {
                    // Retry after 5 minutes - errors might be transient
                    const ERROR_RETRY_MS = 5 * 60 * 1000;
                    const timeSinceError = modelStatus.lastError ? (Date.now() - (typeof modelStatus.lastError === 'number' ? modelStatus.lastError : Date.now())) : Infinity;
                    
                    if (timeSinceError < ERROR_RETRY_MS) {
                        logger.debug(`Skipping provider: ${provider.name}, model: ${model} (Error status, will retry after ${Math.ceil((ERROR_RETRY_MS - timeSinceError) / 1000)}s)`);
                        allErrors.push(new Error(`Model ${model} marked as error (retry in ${Math.ceil((ERROR_RETRY_MS - timeSinceError) / 1000)}s)`));
                        continue;
                    } else {
                        // Error is old, reset status and try again
                        logger.info(`Retrying ${provider.name} / ${model} after error timeout`);
                        providerManager.updateModelStatus(provider.id, model, 'unknown');
                    }
                }

                try {
                    logger.info(`Trying provider: ${provider.name}, model: ${model}`);
                    const response = await this.callProvider(provider, prompt, systemPrompt, temperature, model);

                    providerManager.incrementUsage(provider.id);
                    providerManager.updateStatus(provider.id, 'online');
                    providerManager.updateModelStatus(provider.id, model, 'online');
                    // If it succeeds, clear any potential rate limit (though it shouldn't be there if we checked)
                    providerManager.clearRateLimit(provider.id, model);

                    // Record success in circuit breaker
                    circuitBreaker.recordSuccess(provider.id);

                    return {
                        provider: provider.name,
                        model: model,
                        content: response
                    };
                } catch (error) {
                    logger.error(`Provider ${provider.name}, model ${model} failed: ${error.message}`);
                    if (error.response && error.response.data) {
                        logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
                    }
                    lastError = error;
                    allErrors.push(error); // Collect the error

                    // Check for Rate Limit (429)
                    const isRateLimit = error.response?.status === 429 ||
                        error.message?.toLowerCase().includes('rate limit') ||
                        error.response?.data?.toString().toLowerCase().includes('rate limit');

                    // Check for transient errors (network issues, timeouts, 5xx errors)
                    const isTransientError = error.code === 'ECONNREFUSED' ||
                        error.code === 'ETIMEDOUT' ||
                        error.code === 'ENOTFOUND' ||
                        (error.response?.status >= 500 && error.response?.status < 600) ||
                        error.message?.toLowerCase().includes('timeout') ||
                        error.message?.toLowerCase().includes('network');

                    if (isRateLimit) {
                        logger.warn(`Marking ${provider.name} / ${model} as rate limited for 5 mins.`);
                        providerManager.markRateLimited(provider.id, model);
                    } else if (isTransientError) {
                        // Don't mark as permanent error for transient issues - just log
                        logger.warn(`Transient error for ${provider.name} / ${model}: ${error.message}. Will retry.`);
                        // Record failure in circuit breaker but don't mark model as error
                        circuitBreaker.recordFailure(provider.id);
                    } else {
                        // Permanent error (4xx client errors, auth issues, etc.)
                        logger.error(`Marking ${provider.name} / ${model} as error: ${error.message}`);
                        providerManager.updateModelStatus(provider.id, model, 'error', error.message);
                        // Record failure in circuit breaker
                        circuitBreaker.recordFailure(provider.id);
                    }
                    // Continue to next model in this provider
                }
            }

            // All models failed for this provider, mark provider as error
            providerManager.updateStatus(provider.id, 'error');
        }

        // Throw the aggregated error if all providers failed
        throw new AllProvidersFailedError(allErrors);
    }

    async callProvider(provider, prompt, systemPrompt, temperature, model = null, type = 'text') {
        // This is where we normalize the API calls.
        // Most support OpenAI compatible API.

        // Use provided model or default to first model
        const selectedModel = model || provider.models[0];
        let url = provider.endpoint.replace('{model}', selectedModel).replace('{accountId}', provider.accountId || '');
        if (provider.id === 'ollama') {
            url = url.replace('{host}', provider.host);
        }

        // Handle Image Generation
        if (type === 'image') {
            if (provider.id === 'pollinations') {
                return provider.endpoint
                    .replace('{prompt}', encodeURIComponent(prompt))
                    .replace('{model}', model || provider.models[0]);
            }

            if (provider.id === 'cloudflare') {
                const response = await axiosInstance.post(url, { prompt }, {
                    headers: {
                        'Authorization': `Bearer ${provider.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                });
                
                // Cloudflare might return binary or JSON with base64
                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('application/json')) {
                    const json = JSON.parse(Buffer.from(response.data).toString());
                    if (json.result && json.result.image) {
                        return `data:image/png;base64,${json.result.image}`;
                    }
                }

                const base64 = Buffer.from(response.data, 'binary').toString('base64');
                return `data:image/png;base64,${base64}`;
            }

            throw new Error(`Image generation not implemented for provider: ${provider.name}`);
        }

        // Handle Gemini specific URL if needed, but config has it.
        // Wait, Gemini API is not OpenAI compatible by default unless using the new endpoint or adapter.
        // The config has: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}

        if (provider.id === 'google_gemini') {
            url = url.replace('{key}', provider.key);
            const data = {
                contents: [{
                    parts: [{ text: (systemPrompt ? systemPrompt + "\n" : "") + prompt }]
                }],
                generationConfig: {
                    temperature: temperature
                }
            };
            const response = await axiosInstance.post(url, data);
            return response.data.candidates[0].content.parts[0].text;
        }

        // OpenAI Compatible (Groq, OpenRouter, Ollama, etc.)
        // Headers
        const headers = {
            'Content-Type': 'application/json'
        };
        if (provider.key) {
            headers['Authorization'] = `Bearer ${provider.key}`;
        }
        if (provider.id === 'cloudflare') {
            headers['Authorization'] = `Bearer ${provider.key}`;
        }

        // Anthropic Claude API format
        if (provider.id === 'anthropic') {
            const data = {
                model: model,
                max_tokens: 1024,
                messages: []
            };
            if (systemPrompt) data.system = systemPrompt;
            data.messages.push({ role: 'user', content: prompt });

            // Anthropic requires specific version header and the API key in `x-api-key`
            headers['anthropic-version'] = '2023-06-01';
            if (provider.key) {
                // Some Anthropic integrations expect `x-api-key`; keep Authorization as a fallback
                headers['x-api-key'] = provider.key;
                if (!headers['Authorization']) headers['Authorization'] = `Bearer ${provider.key}`;
            }

            const response = await axiosInstance.post(url, data, { headers });
            return response.data.content[0].text;
        }

        // Cohere v2/chat format
        if (provider.id === 'cohere') {
            const data = {
                model: model,
                messages: [],
                temperature: temperature
            };
            if (systemPrompt) data.messages.push({ role: 'system', content: systemPrompt });
            data.messages.push({ role: 'user', content: prompt });
            const response = await axiosInstance.post(url, data, { headers });
            return response.data.message.content[0].text;
        }

        // NLP Cloud generation endpoint
        if (provider.id === 'nlpcloud') {
            const data = {
                text: (systemPrompt ? systemPrompt + "\n" : "") + prompt,
                max_length: 500
            };
            const response = await axiosInstance.post(url, data, { headers });
            return response.data.generated_text;
        }

        // APIFreeLLM Specific
        if (provider.id === 'apifreellm') {
            const data = {
                message: (systemPrompt ? systemPrompt + "\n" : "") + prompt
            };
            const response = await axiosInstance.post(url, data, { headers });
            if (response.data.status === 'success') {
                return response.data.response;
            } else {
                throw new Error(response.data.error || 'Unknown error from APIFreeLLM');
            }
        }

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const data = {
            model: selectedModel,
            messages: messages,
            temperature: temperature
        };

        // Ollama specific
        // if (provider.id === 'ollama') {
        //     data.stream = false;
        // }

        const response = await axiosInstance.post(url, data, { headers });

        // Parse response
        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        } else if (response.data.message) { // Ollama sometimes
            return response.data.message.content;
        }

        return JSON.stringify(response.data);
    }

    // Stream-friendly wrapper: calls a provider (or fallback) and emits chunks
    // via the provided `onData(chunk)` callback.
    async stream(params, onData) {
        const { prompt, systemPrompt, temperature = 0.7 } = params;
        let requestedModel = params.model;
        if (!requestedModel && params.mode && !['fast', 'smart', 'coding', 'general', 'pending'].includes(params.mode)) {
            requestedModel = params.mode;
        }

        let candidates = providerManager.getAllProviders()
            .filter(p => providerManager.canUseProvider(p.id))
            .sort((a, b) => a.priority - b.priority);

        if (requestedModel) {
            candidates = candidates.filter(p => p.models && p.models.includes(requestedModel));
        }

        if (candidates.length === 0) throw new AllProvidersFailedError([new Error('No available providers')]);

        let lastError = null;
        const allErrors = []; // Array to collect all errors

        for (const provider of candidates) {
            let models = providerManager.getAllModels(provider.id);
            if (requestedModel) models = models.filter(m => m === requestedModel);

            // Try each model in the provider before moving to the next provider
            for (const model of models) {
                // Check for cached rate limit
                if (providerManager.isRateLimited(provider.id, model)) {
                    logger.debug(`Skipping provider (stream): ${provider.name}, model: ${model} (Rate Limited - Cached)`);
                    allErrors.push(new Error(`Provider ${provider.name}, model ${model} is rate limited (cached)`));
                    continue;
                }

                // Check model status - skip models marked as error (unless it's been a while)
                const modelStatus = providerManager.getModelStatus(provider.id, model);
                if (modelStatus.status === 'error') {
                    // Retry after 5 minutes - errors might be transient
                    const ERROR_RETRY_MS = 5 * 60 * 1000;
                    const timeSinceError = modelStatus.lastError ? (Date.now() - (typeof modelStatus.lastError === 'number' ? modelStatus.lastError : Date.now())) : Infinity;
                    
                    if (timeSinceError < ERROR_RETRY_MS) {
                        logger.debug(`Skipping provider (stream): ${provider.name}, model: ${model} (Error status, will retry after ${Math.ceil((ERROR_RETRY_MS - timeSinceError) / 1000)}s)`);
                        allErrors.push(new Error(`Model ${model} marked as error (retry in ${Math.ceil((ERROR_RETRY_MS - timeSinceError) / 1000)}s)`));
                        continue;
                    } else {
                        // Error is old, reset status and try again
                        logger.info(`Retrying ${provider.name} / ${model} after error timeout (stream)`);
                        providerManager.updateModelStatus(provider.id, model, 'unknown');
                    }
                }

                try {
                    logger.info(`Trying provider (stream): ${provider.name}, model: ${model}`);

                    // Emit start marker
                    if (typeof onData === 'function') onData({ type: 'start', provider: provider.name, model: model });

                    let fullContent = '';

                    await this.callProviderStream(provider, prompt, systemPrompt, temperature, model, (chunk) => {
                        fullContent += chunk;
                        if (typeof onData === 'function') onData({ type: 'data', token: chunk });
                    });

                    providerManager.incrementUsage(provider.id);
                    providerManager.updateStatus(provider.id, 'online');
                    providerManager.updateModelStatus(provider.id, model, 'online');
                    providerManager.clearRateLimit(provider.id, model);

                    // Emit end marker with full content
                    if (typeof onData === 'function') onData({ type: 'end', content: fullContent });

                    return { provider: provider.name, model: model, content: fullContent };
                } catch (error) {
                    console.error(`Provider ${provider.name}, model ${model} failed (stream):`, error.message || error);
                    lastError = error;
                    allErrors.push(error); // Collect the error

                    // Check for Rate Limit (429)
                    const isRateLimit = error.response?.status === 429 ||
                        error.message?.toLowerCase().includes('rate limit') ||
                        error.response?.data?.toString().toLowerCase().includes('rate limit');

                    if (isRateLimit) {
                        console.log(`Marking ${provider.name} / ${model} as rate limited for 5 mins.`);
                        providerManager.markRateLimited(provider.id, model);
                    } else {
                        providerManager.updateModelStatus(provider.id, model, 'error', error.message || String(error));
                    }
                    // Continue to next model in this provider
                }
            }

            // All models failed for this provider, mark provider as error
            providerManager.updateStatus(provider.id, 'error');
        }

        // Throw the aggregated error if all providers failed
        throw new AllProvidersFailedError(allErrors);
    }

    async callProviderStream(provider, prompt, systemPrompt, temperature, model = null, onChunk) {
        const selectedModel = model || provider.models[0];
        let url = provider.endpoint.replace('{model}', selectedModel).replace('{accountId}', provider.accountId || '');
        if (provider.id === 'ollama') {
            url = url.replace('{host}', provider.host);
        }

        // Google Gemini Streaming
        if (provider.id === 'google_gemini') {
            // Switch to streamGenerateContent endpoint
            url = url.replace(':generateContent', ':streamGenerateContent');
            url = url.replace('{key}', provider.key);
            url += '&alt=sse'; // Ensure SSE format

            const data = {
                contents: [{
                    parts: [{ text: (systemPrompt ? systemPrompt + "\n" : "") + prompt }]
                }],
                generationConfig: {
                    temperature: temperature
                }
            };

            const response = await axiosInstance.post(url, data, {
                responseType: 'stream'
            });

            const stream = response.data;
            stream.on('data', (chunk) => {
                try {
                    const lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const jsonStr = line.substring(5).trim();
                                if (!jsonStr) continue;
                                const json = JSON.parse(jsonStr);
                                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    try {
                                        onChunk(text);
                                    } catch (chunkError) {
                                        logger.error('Error in onChunk callback (Gemini):', chunkError);
                                    }
                                }
                            } catch (e) {
                                logger.debug('Failed to parse Gemini stream chunk:', e);
                            }
                        }
                    }
                } catch (err) {
                    logger.error('Gemini stream data processing error:', err);
                }
            });

            return new Promise((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('error', (err) => {
                    logger.error('Gemini stream error:', err);
                    reject(err);
                });
            });
        }

        // Anthropic Claude Streaming
        if (provider.id === 'anthropic') {
            const headers = {
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'x-api-key': provider.key
            };

            const data = {
                model: model,
                max_tokens: 1024,
                messages: [],
                stream: true
            };
            if (systemPrompt) data.system = systemPrompt;
            data.messages.push({ role: 'user', content: prompt });

            const response = await axiosInstance.post(url, data, {
                headers,
                responseType: 'stream'
            });

            const stream = response.data;
            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('event: content_block_delta') || line.startsWith('data:')) {
                        // Anthropic sends event: ... then data: ...
                        // But axios stream might give us raw bytes.
                        // Simplified parsing for Anthropic SSE
                    }
                    if (line.startsWith('data:')) {
                        const jsonStr = line.substring(5).trim();
                        if (jsonStr === '[DONE]') return;
                        try {
                            const json = JSON.parse(jsonStr);
                            if (json.type === 'content_block_delta' && json.delta?.text) {
                                try {
                                    onChunk(json.delta.text);
                                } catch (chunkError) {
                                    logger.error('Error in onChunk callback (Anthropic):', chunkError);
                                }
                            }
                        } catch (e) { logger.debug('Failed to parse Anthropic stream chunk:', e); }
                    }
                }
            });

            return new Promise((resolve, reject) => {
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        }

        // OpenAI Compatible Streaming (Groq, OpenRouter, Ollama, etc.)
        const headers = {
            'Content-Type': 'application/json'
        };
        if (provider.key) {
            headers['Authorization'] = `Bearer ${provider.key}`;
        }
        if (provider.id === 'cloudflare') {
            headers['Authorization'] = `Bearer ${provider.key}`;
        }

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const data = {
            model: selectedModel,
            messages: messages,
            temperature: temperature,
            stream: true
        };

        const response = await axiosInstance.post(url, data, {
            headers,
            responseType: 'stream'
        });

        const stream = response.data;
        stream.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                    const dataStr = trimmed.substring(5).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const json = JSON.parse(dataStr);
                        const content = json.choices?.[0]?.delta?.content || json.message?.content /* Ollama */;
                        if (content) {
                            try {
                                onChunk(content);
                            } catch (chunkError) {
                                logger.error('Error in onChunk callback (OpenAI-compatible):', chunkError);
                            }
                        }
                    } catch (e) { logger.debug('Failed to parse stream chunk:', e); }
                }
            }
        });

        return new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });
    }
}

export default new Orchestrator();
