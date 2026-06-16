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
