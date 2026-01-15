/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily blocking requests to failing services
 */

export class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5; // Failures before opening
        this.resetTimeout = options.resetTimeout || 60000; // 1 minute default
        this.halfOpenAttempts = options.halfOpenAttempts || 3; // Attempts in half-open state

        // State: 'closed', 'open', 'half-open'
        // closed = normal operation
        // open = circuit is open, rejecting all requests  
        // half-open = testing if service recovered

        this.circuits = new Map(); // providerId -> circuit state
    }

    /**
     * Get or create circuit for a provider
     * @param {string} providerId 
     * @returns {object} Circuit state
     */
    getCircuit(providerId) {
        if (!this.circuits.has(providerId)) {
            this.circuits.set(providerId, {
                state: 'closed',
                failures: 0,
                nextAttempt: null,
                halfOpenAttempts: 0
            });
        }
        return this.circuits.get(providerId);
    }

    /**
     * Check if a request can be attempted
     * @param {string} providerId
     * @returns {boolean} True if request can proceed
     */
    canAttempt(providerId) {
        const circuit = this.getCircuit(providerId);

        if (circuit.state === 'closed') {
            return true;
        }

        if (circuit.state === 'open') {
            // Check if it's time to try half-open
            if (Date.now() >= circuit.nextAttempt) {
                circuit.state = 'half-open';
                circuit.halfOpenAttempts = 0;
                return true;
            }
            return false; // Circuit still open
        }

        if (circuit.state === 'half-open') {
            // Allow limited attempts in half-open state
            return circuit.halfOpenAttempts < this.halfOpenAttempts;
        }

        return false;
    }

    /**
     * Record a successful request
     * @param {string} providerId
     */
    recordSuccess(providerId) {
        const circuit = this.getCircuit(providerId);

        if (circuit.state === 'half-open') {
            circuit.halfOpenAttempts++;

            // If enough successful attempts, close the circuit
            if (circuit.halfOpenAttempts >= this.halfOpenAttempts) {
                circuit.state = 'closed';
                circuit.failures = 0;
                circuit.nextAttempt = null;
                circuit.halfOpenAttempts = 0;
            }
        } else if (circuit.state === 'closed') {
            // Reset failure count on success
            circuit.failures = Math.max(0, circuit.failures - 1);
        }
    }

    /**
     * Record a failed request
     * @param {string} providerId
     */
    recordFailure(providerId) {
        const circuit = this.getCircuit(providerId);

        circuit.failures++;

        if (circuit.state === 'half-open') {
            // Half-open failure immediately opens circuit again
            circuit.state = 'open';
            circuit.nextAttempt = Date.now() + this.resetTimeout;
            circuit.halfOpenAttempts = 0;
        } else if (circuit.state === 'closed') {
            // Check if threshold exceeded
            if (circuit.failures >= this.failureThreshold) {
                circuit.state = 'open';
                circuit.nextAttempt = Date.now() + this.resetTimeout;
            }
        }
    }

    /**
     * Get current state of a circuit
     * @param {string} providerId
     * @returns {{state: string, failures: number, nextAttempt: number|null}}
     */
    getState(providerId) {
        const circuit = this.getCircuit(providerId);
        return {
            state: circuit.state,
            failures: circuit.failures,
            nextAttempt: circuit.nextAttempt,
            canAttempt: this.canAttempt(providerId)
        };
    }

    /**
     * Manually reset a circuit (for testing or admin operations)
     * @param {string} providerId
     */
    reset(providerId) {
        if (this.circuits.has(providerId)) {
            const circuit = this.circuits.get(providerId);
            circuit.state = 'closed';
            circuit.failures = 0;
            circuit.nextAttempt = null;
            circuit.halfOpenAttempts = 0;
        }
    }

    /**
     * Get all circuit states
     * @returns {Map} All circuits
     */
    getAllStates() {
        const states = {};
        for (const [providerId, circuit] of this.circuits) {
            states[providerId] = {
                state: circuit.state,
                failures: circuit.failures,
                nextAttempt: circuit.nextAttempt,
                canAttempt: this.canAttempt(providerId)
            };
        }
        return states;
    }
}

export default CircuitBreaker;
