import config from './config.js';
import statusPersistence from './statusPersistence.js';

class ProviderManager {
    constructor() {
        this.providers = {};
        this.usage = {};
        this.modelStatus = {}; // Track status per model: { providerId: { modelName: { status, lastError, lastSuccess } } }
        this.rateLimits = {}; // Track rate limits: { providerId: { modelName: expiryTimestamp } }
        this.initialize();

        // Cleanup expired rate limits every 5 minutes
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    initialize() {
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
                modelStatuses: this.modelStatus[p.id] || {}
            };
        });
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
        // Check in-memory cache first
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
