import config from './config.js';
import statusPersistence from './statusPersistence.js';

class ProviderManager {
    constructor() {
        this.providers = {};
        this.usage = {};
        this.modelStatus = {}; // Track status per model: { providerId: { modelName: { status, lastError, lastSuccess } } }
        this.rateLimits = {}; // Track rate limits: { providerId: { modelName: expiryTimestamp } }
        this.liveRateLimits = {}; // Track live rate limits: { providerId: { modelName: { requestsRemaining, tokensRemaining, ... } } }
        this.initialize();

        // Cleanup expired rate limits every 5 minutes
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    initialize() {
        // Load live rate limits from DB
        const persistedLiveLimits = statusPersistence.getAllLiveRateLimits();
        for (const limit of persistedLiveLimits) {
            if (!this.liveRateLimits[limit.provider_id]) this.liveRateLimits[limit.provider_id] = {};
            this.liveRateLimits[limit.provider_id][limit.model_name] = {
                requestsLimit: limit.requests_limit,
                requestsRemaining: limit.requests_remaining,
                requestsReset: limit.requests_reset,
                tokensLimit: limit.tokens_limit,
                tokensRemaining: limit.tokens_remaining,
                tokensReset: limit.tokens_reset,
                lastUpdated: limit.last_updated
            };
        }

        for (const [key, providerConfig] of Object.entries(config.providers)) {
            // Compute a heuristic heavy_usage score (0-100) based on model names and configured priority
            const heavyUsageScore = this.computeHeavyUsage(providerConfig);

            this.providers[key] = {
                ...providerConfig,
                id: key,
                heavy_usage: heavyUsageScore,
                status: 'unknown', // unknown, online, offline, rate_limited
                latency: 0,
                lastUsed: 0,
                errors: 0
            };
            this.usage[key] = {
                requestsToday: 0,
                requestsThisMinute: 0,
                lastResetMinute: Date.now(),
                lastResetDay: Date.now()
            };

            // Initialize rate limits and load persistent status
            this.rateLimits[key] = {};
            this.modelStatus[key] = {};

            // Load persistent status and iterate models
            const allPossibleModels = [...(providerConfig.models || []), ...(providerConfig.imageModels || [])];
            for (const model of allPossibleModels) {
                const pStatus = statusPersistence.get(key, model);
                if (pStatus) {
                    // Check if expired (5 mins)
                    const RATE_LIMIT_EXPIRY_MS = 5 * 60 * 1000;
                    const isExpired = (Date.now() - pStatus.lastUpdated) > RATE_LIMIT_EXPIRY_MS;

                    if (!isExpired) {
                        this.modelStatus[key][model] = {
                            status: pStatus.status,
                            lastError: pStatus.status === 'error' ? pStatus.error : null,
                            lastSuccess: pStatus.status === 'online' ? pStatus.lastUpdated : null
                        };

                        // If it was rate limited (error with specific message), restore rate limit
                        if (pStatus.status === 'error' && pStatus.error && pStatus.error.includes('Rate limited')) {
                            // Calculate remaining time
                            const remaining = (5 * 60 * 1000) - (Date.now() - pStatus.lastUpdated);
                            if (remaining > 0) {
                                this.rateLimits[key][model] = Date.now() + remaining;
                            }
                        }
                    } else {
                        // Expired, treat as unknown/fresh
                        this.modelStatus[key][model] = {
                            status: 'unknown',
                            lastError: null,
                            lastSuccess: null
                        };
                    }
                } else {
                    this.modelStatus[key][model] = {
                        status: 'unknown',
                        lastError: null,
                        lastSuccess: null
                    };
                }
            }
        }
    }

    computeHeavyUsage(providerConfig) {
        try {
            const models = providerConfig.models || [];
            let score = 30 + (10 * (10 - (providerConfig.priority || 5)));

            // Boost score for larger models or names that suggest "heavy" capability
            for (const m of models) {
                const name = String(m).toLowerCase();
                if (name.includes('70b') || name.includes('70')) score += 30;
                if (name.includes('llama') || name.includes('llama-3') || name.includes('llama3')) score += 20;
                if (name.includes('mixtral') || name.includes('mixtral-8')) score += 10;
                if (name.includes('8b')) score += 10;
            }

            // Clamp
            if (score > 100) score = 100;
            if (score < 0) score = 0;
            return Math.round(score);
        } catch (e) {
            return 50;
        }
    }

    getProvider(id) {
        return this.providers[id];
    }

    getAllProviders() {
        return Object.values(this.providers).map(p => {
            return {
                ...p,
                modelStatuses: this.modelStatus[p.id] || {},
                liveRateLimits: this.liveRateLimits[p.id] || {}
            };
        });
    }

    updateLiveRateLimits(providerId, modelName, headers) {
        if (!headers) return;

        const data = {
            providerId,
            modelName,
            requestsLimit: null,
            requestsRemaining: null,
            requestsReset: null,
            tokensLimit: null,
            tokensRemaining: null,
            tokensReset: null
        };

        // Normalize Headers (case-insensitive)
        const h = {};
        for (const key in headers) {
            h[key.toLowerCase()] = headers[key];
        }

        // 1. Groq & OpenAI & OpenRouter (Standard x-ratelimit-*)
        if (h['x-ratelimit-limit-requests']) data.requestsLimit = parseInt(h['x-ratelimit-limit-requests']);
        if (h['x-ratelimit-remaining-requests']) data.requestsRemaining = parseInt(h['x-ratelimit-remaining-requests']);
        if (h['x-ratelimit-reset-requests']) {
            data.requestsReset = this.parseResetTime(h['x-ratelimit-reset-requests']);
        }

        if (h['x-ratelimit-limit-tokens']) data.tokensLimit = parseInt(h['x-ratelimit-limit-tokens']);
        if (h['x-ratelimit-remaining-tokens']) data.tokensRemaining = parseInt(h['x-ratelimit-remaining-tokens']);
        if (h['x-ratelimit-reset-tokens']) {
            data.tokensReset = this.parseResetTime(h['x-ratelimit-reset-tokens']);
        }

        // 2. Anthropic (anthropic-ratelimit-*)
        if (h['anthropic-ratelimit-requests-limit']) data.requestsLimit = parseInt(h['anthropic-ratelimit-requests-limit']);
        if (h['anthropic-ratelimit-requests-remaining']) data.requestsRemaining = parseInt(h['anthropic-ratelimit-requests-remaining']);
        if (h['anthropic-ratelimit-requests-reset']) {
            data.requestsReset = new Date(h['anthropic-ratelimit-requests-reset']).getTime();
        }

        if (h['anthropic-ratelimit-tokens-limit']) data.tokensLimit = parseInt(h['anthropic-ratelimit-tokens-limit']);
        if (h['anthropic-ratelimit-tokens-remaining']) data.tokensRemaining = parseInt(h['anthropic-ratelimit-tokens-remaining']);
        if (h['anthropic-ratelimit-tokens-reset']) {
            data.tokensReset = new Date(h['anthropic-ratelimit-tokens-reset']).getTime();
        }

        // 3. GitHub Models (Specific Unix epoch seconds)
        if (h['x-ratelimit-resource'] === 'models' || h['x-ratelimit-type']?.includes('Model')) {
            if (h['x-ratelimit-limit']) data.requestsLimit = parseInt(h['x-ratelimit-limit']);
            if (h['x-ratelimit-remaining']) data.requestsRemaining = parseInt(h['x-ratelimit-remaining']);
            if (h['x-ratelimit-reset']) {
                const val = parseInt(h['x-ratelimit-reset']);
                data.requestsReset = val * 1000; // Unix epoch seconds to ms
            }
        }

        // 4. Mistral AI (x-ratelimit-*-minute)
        if (h['x-ratelimit-limit-requests-minute']) data.requestsLimit = parseInt(h['x-ratelimit-limit-requests-minute']);
        if (h['x-ratelimit-remaining-requests-minute']) data.requestsRemaining = parseInt(h['x-ratelimit-remaining-requests-minute']);
        if (h['x-ratelimit-limit-tokens-minute']) data.tokensLimit = parseInt(h['x-ratelimit-limit-tokens-minute']);
        if (h['x-ratelimit-remaining-tokens-minute']) data.tokensRemaining = parseInt(h['x-ratelimit-remaining-tokens-minute']);

        // 5. OpenRouter fallback/additional
        if (!data.requestsLimit && h['x-ratelimit-limit']) data.requestsLimit = parseInt(h['x-ratelimit-limit']);
        if (!data.requestsRemaining && h['x-ratelimit-remaining']) data.requestsRemaining = parseInt(h['x-ratelimit-remaining']);
        if (!data.requestsReset && h['x-ratelimit-reset']) {
            data.requestsReset = this.parseResetTime(h['x-ratelimit-reset']);
        }

        // Update if we got meaningful remaining data
        if (data.requestsRemaining !== null || data.tokensRemaining !== null) {
            if (!this.liveRateLimits[providerId]) this.liveRateLimits[providerId] = {};
            
            // Store as model-specific
            this.liveRateLimits[providerId][modelName] = {
                ...data,
                lastUpdated: Date.now(),
                isProviderWide: false
            };
            statusPersistence.upsertLiveRateLimit({ ...data, providerId, modelName });

            // If we have a generic header set, store as providerWide for fallback
            // This is a simple heuristic: if requestsLimit is very high or matches known provider patterns
            if (this.isLikelyProviderWide(h)) {
                this.liveRateLimits[providerId]['providerWide'] = {
                    ...data,
                    lastUpdated: Date.now(),
                    isProviderWide: true
                };
                statusPersistence.upsertLiveRateLimit({ ...data, providerId, modelName: 'providerWide' });
            }
        }
    }

    isLikelyProviderWide(h) {
        // Heuristic: If headers are present without model-specific context
        return !!(h['x-ratelimit-limit-requests'] || h['anthropic-ratelimit-requests-limit']);
    }

    parseResetTime(resetStr) {
        if (!resetStr) return null;
        if (!isNaN(resetStr)) {
            const val = parseFloat(resetStr);
            // If it's a small number, assume seconds from now
            if (val < 1000000) return Date.now() + (val * 1000);
            // If it's a timestamp
            return val * 1000;
        }

        // Parse "1s", "1m2s", "1h3m", "10ms"
        let totalMs = 0;
        const hMatch = resetStr.match(/(\d+)h/);
        const mMatch = resetStr.match(/(\d+)m/);
        const sMatch = resetStr.match(/([\d.]+)s/);
        const msMatch = resetStr.match(/([\d.]+)ms/);

        if (hMatch) totalMs += parseInt(hMatch[1]) * 3600000;
        if (mMatch) totalMs += parseInt(mMatch[1]) * 60000;
        if (sMatch && !msMatch) totalMs += parseFloat(sMatch[1]) * 1000;
        if (msMatch) totalMs += parseFloat(msMatch[1]);

        if (totalMs > 0) return Date.now() + totalMs;
        return null;
    }

    updateStatus(id, status, latency = 0) {
        if (this.providers[id]) {
            this.providers[id].status = status;
            if (latency > 0) {
                // Simple moving average for latency
                this.providers[id].latency = (this.providers[id].latency * 0.7) + (latency * 0.3);
            }
        }
    }

    canUseProvider(id) {
        const provider = this.providers[id];
        const usage = this.usage[id];

        if (!provider) return false;
        if (provider.status === 'offline' || provider.status === 'rate_limited') return false;

        // Check limits
        this.checkResetLimits(id);

        if (usage.requestsThisMinute >= provider.rpm) return false;
        if (usage.requestsToday >= provider.daily_limit) return false;

        return true;
    }

    incrementUsage(id) {
        if (this.usage[id]) {
            this.usage[id].requestsToday++;
            this.usage[id].requestsThisMinute++;
            this.providers[id].lastUsed = Date.now();
        }
    }

    checkResetLimits(id) {
        const usage = this.usage[id];
        const now = Date.now();

        // Reset minute limit
        if (now - usage.lastResetMinute > 60000) {
            usage.requestsThisMinute = 0;
            usage.lastResetMinute = now;
        }

        // Reset daily limit
        if (now - usage.lastResetDay > 86400000) {
            usage.requestsToday = 0;
            usage.lastResetDay = now;
        }
    }

    // Model-level status management
    updateModelStatus(providerId, modelName, status, error = null) {
        if (!this.modelStatus[providerId]) {
            this.modelStatus[providerId] = {};
        }
        if (!this.modelStatus[providerId][modelName]) {
            this.modelStatus[providerId][modelName] = {
                status: 'unknown',
                lastError: null,
                lastSuccess: null
            };
        }
        this.modelStatus[providerId][modelName].status = status;
        if (status === 'online') {
            this.modelStatus[providerId][modelName].lastSuccess = Date.now();
        } else if (status === 'error' || status === 'offline') {
            this.modelStatus[providerId][modelName].lastError = error || Date.now();
        }

        // Persist
        statusPersistence.updateModelStatus(providerId, modelName, status, error);
    }

    getModelStatus(providerId, modelName) {
        return this.modelStatus[providerId]?.[modelName] || { status: 'unknown', lastError: null, lastSuccess: null };
    }

    getAvailableModels(providerId) {
        const provider = this.providers[providerId];
        if (!provider) return [];

        // Return models that are not marked as offline or error
        return (provider.models || []).filter(model => {
            const status = this.getModelStatus(providerId, model);
            return status.status !== 'offline';
        });
    }

    getProvidersByType(type = 'text') {
        return Object.values(this.providers).filter(p => {
            if (type === 'image') {
                return p.type === 'image' || (p.imageModels && p.imageModels.length > 0);
            }
            return p.type === 'text' || !p.type; // Default to text
        });
    }

    getAllModels(providerId, type = 'text') {
        const provider = this.providers[providerId];
        if (type === 'image') {
            // Priority: imageModels array, then models array if type is image
            if (provider?.imageModels && provider.imageModels.length > 0) return provider.imageModels;
            if (provider?.type === 'image') return provider.models || [];
            return [];
        }
        return provider?.models || [];
    }

    // Rate Limit Caching
    isRateLimited(providerId, modelName) {
        // Check live rate limits first
        const liveModel = this.liveRateLimits[providerId]?.[modelName];
        const liveProvider = this.liveRateLimits[providerId]?.['providerWide'];
        
        const live = liveModel || liveProvider; // Use model-specific if exists, otherwise provider-wide
        
        if (live) {
            const now = Date.now();
            // Check requests
            if (live.requestsRemaining === 0 && live.requestsReset && now < live.requestsReset) {
                return true;
            }
            // Check tokens
            if (live.tokensRemaining === 0 && live.tokensReset && now < live.tokensReset) {
                return true;
            }
        }

        // Check in-memory cache (the 5-min cooldown)
        if (this.rateLimits[providerId] && this.rateLimits[providerId][modelName]) {
            const expiry = this.rateLimits[providerId][modelName];
            if (Date.now() <= expiry) return true;
            // Expired in memory, clear it
            delete this.rateLimits[providerId][modelName];
        }

        // Check persistence (double check expiration)
        const pStatus = statusPersistence.get(providerId, modelName);
        if (pStatus && pStatus.status === 'error' && pStatus.error && pStatus.error.includes('Rate limited')) {
            const isExpired = (Date.now() - pStatus.lastUpdated) > (5 * 60 * 1000);
            if (!isExpired) return true;
        }

        return false;
    }

    markRateLimited(providerId, modelName) {
        if (!this.rateLimits[providerId]) this.rateLimits[providerId] = {};
        // 5 minutes cache
        this.rateLimits[providerId][modelName] = Date.now() + (5 * 60 * 1000);
        this.updateModelStatus(providerId, modelName, 'error', 'Rate limited (cached)');
    }

    clearRateLimit(providerId, modelName) {
        if (this.rateLimits[providerId]) {
            delete this.rateLimits[providerId][modelName];
        }
    }

    cleanupRateLimits() {
        const now = Date.now();
        for (const providerId in this.rateLimits) {
            for (const modelName in this.rateLimits[providerId]) {
                if (now > this.rateLimits[providerId][modelName]) {
                    delete this.rateLimits[providerId][modelName];
                }
            }
            // cleanup empty provider keys
            if (Object.keys(this.rateLimits[providerId]).length === 0) {
                delete this.rateLimits[providerId];
            }
        }
    }
}

export default new ProviderManager();
