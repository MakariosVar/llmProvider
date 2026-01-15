export class AllProvidersFailedError extends Error {
    constructor(errors) {
        super('All providers failed');
        this.name = 'AllProvidersFailedError';
        this.errors = errors;
    }
}
