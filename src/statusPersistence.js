import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = 'status.db';
const JSON_DB_FILE = 'status_db.json';

class StatusPersistence {
    constructor() {
        this.db = new Database(path.resolve(DB_FILE));
        this.init();
        this.migrateFromJson();
    }

    init() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS model_status (
                provider_id TEXT,
                model_name TEXT,
                status TEXT,
                last_updated INTEGER,
                error TEXT,
                PRIMARY KEY (provider_id, model_name)
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS request_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id TEXT,
                model_name TEXT,
                status TEXT,
                latency INTEGER,
                tokens INTEGER,
                type TEXT,
                timestamp INTEGER,
                error_message TEXT
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS model_pricing (
                model_name TEXT PRIMARY KEY,
                prompt_price REAL,
                completion_price REAL,
                updated_at INTEGER
            )
        `);
    }

    upsertPricing(modelName, promptPrice, completionPrice) {
        try {
            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO model_pricing (model_name, prompt_price, completion_price, updated_at)
                VALUES (?, ?, ?, ?)
            `);
            insert.run(modelName, promptPrice, completionPrice, Date.now());
        } catch (error) {
            console.error('Failed to upsert pricing in SQLite:', error.message);
        }
    }

    getPricing(modelName) {
        try {
            return this.db.prepare('SELECT * FROM model_pricing WHERE model_name = ?').get(modelName);
        } catch (error) {
            console.error('Failed to get pricing from SQLite:', error.message);
            return null;
        }
    }

    getAllPricing() {
        try {
            return this.db.prepare('SELECT * FROM model_pricing').all();
        } catch (error) {
            console.error('Failed to get all pricing from SQLite:', error.message);
            return [];
        }
    }

    migrateFromJson() {
        const jsonPath = path.resolve(JSON_DB_FILE);
        if (fs.existsSync(jsonPath)) {
            try {
                const fileContent = fs.readFileSync(jsonPath, 'utf-8');
                const data = JSON.parse(fileContent);
                
                const insert = this.db.prepare(`
                    INSERT OR REPLACE INTO model_status (provider_id, model_name, status, last_updated, error)
                    VALUES (?, ?, ?, ?, ?)
                `);

                const transaction = this.db.transaction((data) => {
                    for (const providerId in data) {
                        for (const modelName in data[providerId]) {
                            const entry = data[providerId][modelName];
                            insert.run(
                                providerId,
                                modelName,
                                entry.status,
                                entry.lastUpdated,
                                entry.error || null
                            );
                        }
                    }
                });

                transaction(data);
                console.log('Successfully migrated data from JSON to SQLite');
                
                // Rename JSON file to backup
                fs.renameSync(jsonPath, jsonPath + '.backup');
            } catch (error) {
                console.error('Failed to migrate status DB from JSON:', error.message);
            }
        }
    }

    updateModelStatus(providerId, modelName, status, error = null) {
        try {
            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO model_status (provider_id, model_name, status, last_updated, error)
                VALUES (?, ?, ?, ?, ?)
            `);
            insert.run(providerId, modelName, status, Date.now(), error ? String(error) : null);
        } catch (error) {
            console.error('Failed to update model status in SQLite:', error.message);
        }
    }

    logRequest({ providerId, modelName, status, latency, tokens, type, errorMessage = null }) {
        console.log("logRequest called:", { providerId, modelName, status });
        try {
            const insert = this.db.prepare(`
                INSERT INTO request_history (provider_id, model_name, status, latency, tokens, type, timestamp, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insert.run(providerId, modelName, status, latency, tokens, type, Date.now(), errorMessage);
        } catch (error) {
            console.error('Failed to log request in SQLite:', error.message);
        }
    }

    getStats() {
        try {
            const totalRequests = this.db.prepare('SELECT COUNT(*) as count FROM request_history').get().count;
            const successRequests = this.db.prepare("SELECT COUNT(*) as count FROM request_history WHERE status = 'success'").get().count;
            const totalTokens = this.db.prepare('SELECT SUM(tokens) as count FROM request_history').get().count || 0;
            const avgLatency = this.db.prepare("SELECT AVG(latency) as avg FROM request_history WHERE status = 'success'").get().avg || 0;

            const providerStats = this.db.prepare(`
                SELECT 
                    provider_id, 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                    AVG(latency) as avg_latency,
                    SUM(tokens) as total_tokens
                FROM request_history 
                GROUP BY provider_id
            `).all();

            const modelStats = this.db.prepare(`
                SELECT 
                    provider_id,
                    model_name,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                    AVG(latency) as avg_latency,
                    SUM(tokens) as total_tokens
                FROM request_history 
                GROUP BY provider_id, model_name
            `).all();

            return {
                summary: {
                    totalRequests,
                    successRequests,
                    totalTokens,
                    avgLatency: Math.round(avgLatency)
                },
                providers: providerStats,
                models: modelStats
            };
        } catch (error) {
            console.error('Failed to get stats from SQLite:', error.message);
            return null;
        }
    }

    getHistory(limit = 100, offset = 0) {
        try {
            return this.db.prepare('SELECT * FROM request_history ORDER BY timestamp DESC LIMIT ? OFFSET ?')
                .all(limit, offset);
        } catch (error) {
            console.error('Failed to get history from SQLite:', error.message);
            return [];
        }
    }

    get(providerId, modelName) {
        try {
            const row = this.db.prepare('SELECT * FROM model_status WHERE provider_id = ? AND model_name = ?')
                .get(providerId, modelName);
            
            if (row) {
                return {
                    status: row.status,
                    lastUpdated: row.last_updated,
                    error: row.error
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get model status from SQLite:', error.message);
            return null;
        }
    }

    getAll() {
        try {
            const rows = this.db.prepare('SELECT * FROM model_status').all();
            const result = {};
            
            for (const row of rows) {
                if (!result[row.provider_id]) {
                    result[row.provider_id] = {};
                }
                result[row.provider_id][row.model_name] = {
                    status: row.status,
                    lastUpdated: row.last_updated,
                    error: row.error
                };
            }
            return result;
        } catch (error) {
            console.error('Failed to get all model statuses from SQLite:', error.message);
            return {};
        }
    }

    load() {
        // No-op for SQLite as it's always "loaded"
    }

    close() {
        this.db.close();
    }
}

export default new StatusPersistence();
