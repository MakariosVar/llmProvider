import axios from 'axios';
import statusPersistence from './statusPersistence.js';
import { calculateRating } from './utils/rating.js';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

class PricingManager {
    constructor() {
        this.updateInterval = 4 * 60 * 60 * 1000; // 4 hours
    }

    async start() {
        await this.updatePricing();
        setInterval(() => this.updatePricing(), this.updateInterval);
    }

    async updatePricing() {
        try {
            console.log('Updating pricing and rating data...');
            const response = await axios.get(OPENROUTER_MODELS_URL);
            const models = response.data.data;

            for (const model of models) {
                if (model.pricing) {
                    const rating = calculateRating(model);
                    statusPersistence.upsertPricing(
                        model.id,
                        parseFloat(model.pricing.prompt) || 0,
                        parseFloat(model.pricing.completion) || 0,
                        parseFloat(rating) || 0
                    );
                }
            }
            console.log('Pricing and rating data updated successfully.');
        } catch (error) {
            console.error('Failed to update pricing data:', error.message);
        }
    }
}

export default new PricingManager();
