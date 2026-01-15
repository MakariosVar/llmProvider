import fs from 'fs';
import path from 'path';

const DB_FILE = 'status_db.json';

class StatusPersistence {
    constructor() {
        this.filePath = path.resolve(DB_FILE);
        this.data = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Failed to load status DB:', error.message);
            this.data = {};
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Failed to save status DB:', error.message);
        }
    }

    updateModelStatus(providerId, modelName, status, error = null) {
        if (!this.data[providerId]) {
            this.data[providerId] = {};
        }

        this.data[providerId][modelName] = {
            status,
            lastUpdated: Date.now(),
            error: error ? String(error) : null
        };

        this.save();
    }

    get(providerId, modelName) {
        return this.data[providerId]?.[modelName] || null;
    }

    getAll() {
        return this.data;
    }
}

export default new StatusPersistence();
