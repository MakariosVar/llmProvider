/**
 * Circuit Breaker pattern implementation to prevent cascading failures
 * States: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5; // Number of failures before opening
        this.successThreshold = options.successThreshold || 2; // Successes in half-open before closing
        this.timeout = options.timeout || 60000; // Time to wait before trying again (ms)
        this.onStateChange = options.onStateChange || (() => { });

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = Date.now();
        this.lastError = null;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttempt: this.nextAttempt,
            lastError: this.lastError
        };
    }

    /**
     * Execute a function with circuit breaker protection
     * @param {Function} fn - Async function to execute
     * @returns {Promise} - Result of function or throws if circuit is open
     */
    async execute(fn) {
        // Check if circuit is OPEN
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}. Last error: ${this.lastError}`);
            }
            // Time has passed, try HALF_OPEN
            this.setState('HALF_OPEN');
            this.successCount = 0;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Record successful execution
     */
    onSuccess() {
        this.failureCount = 0;

        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.setState('CLOSED');
            }
        }
    }

    /**
     * Record failed execution
     */
    onFailure(error) {
        this.failureCount++;
        this.lastError = error?.message || String(error);

        if (this.state === 'HALF_OPEN') {
            // If recovery attempt fails, go back to OPEN
            this.setState('OPEN');
            this.nextAttempt = Date.now() + this.timeout;
        } else if (this.failureCount >= this.failureThreshold) {
            this.setState('OPEN');
            this.nextAttempt = Date.now() + this.timeout;
        }
    }

    /**
     * Manually reset the circuit breaker
     */
    reset() {
        this.failureCount = 0;
        this.successCount = 0;
        this.setState('CLOSED');
        this.lastError = null;
    }

    /**
     * Set state and trigger callback
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;

        if (oldState !== newState) {
            this.onStateChange(newState, oldState);
        }
    }

    /**
     * Check if circuit allows requests
     */
    isAvailable() {
        return this.state === 'CLOSED' ||
            (this.state === 'OPEN' && Date.now() >= this.nextAttempt);
    }
}

export default CircuitBreaker;
