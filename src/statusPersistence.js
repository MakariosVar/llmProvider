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
        this.cleanupOldRecords(60);
        setInterval(() => this.cleanupOldRecords(60), 24 * 60 * 60 * 1000);
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
            CREATE TABLE IF NOT EXISTS provider_usage (
                provider_id TEXT PRIMARY KEY,
                requests_today INTEGER,
                requests_this_minute INTEGER,
                last_updated INTEGER
            )
        `);

        // Check if old tokens column exists
        const tableInfo = this.db.prepare("PRAGMA table_info(request_history)").all();
        const hasTokensColumn = tableInfo.some(col => col.name === 'tokens');
        
        if (hasTokensColumn) {
             this.db.exec("ALTER TABLE request_history RENAME TO request_history_old");
        }
        
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS request_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id TEXT,
                model_name TEXT,
                status TEXT,
                latency INTEGER,
                input_tokens INTEGER,
                output_tokens INTEGER,
                type TEXT,
                timestamp INTEGER,
                error_message TEXT
            )
        `);

        if (hasTokensColumn) {
            try {
                this.db.exec(`INSERT INTO request_history (id, provider_id, model_name, status, latency, input_tokens, output_tokens, type, timestamp, error_message) 
                              SELECT id, provider_id, model_name, status, latency, tokens, 0, type, timestamp, error_message FROM request_history_old`);
                this.db.exec("DROP TABLE request_history_old");
            } catch (e) {
                console.error("Migration failed", e);
            }
        }

        this.db.exec("DROP TABLE IF EXISTS model_pricing");
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS model_pricing (
                model_name TEXT PRIMARY KEY,
                prompt_price REAL,
                completion_price REAL,
                rating REAL,
                updated_at INTEGER
            )
        `);

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS live_rate_limits (
                provider_id TEXT,
                model_name TEXT,
                requests_limit INTEGER,
                requests_remaining INTEGER,
                requests_reset INTEGER,
                tokens_limit INTEGER,
                tokens_remaining INTEGER,
                tokens_reset INTEGER,
                last_updated INTEGER,
                PRIMARY KEY (provider_id, model_name)
            )
        `);
    }

    upsertLiveRateLimit(data) {
        try {
            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO live_rate_limits (
                    provider_id, model_name, 
                    requests_limit, requests_remaining, requests_reset,
                    tokens_limit, tokens_remaining, tokens_reset,
                    last_updated
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insert.run(
                data.providerId,
                data.modelName,
                data.requestsLimit || null,
                data.requestsRemaining || null,
                data.requestsReset || null,
                data.tokensLimit || null,
                data.tokensRemaining || null,
                data.tokensReset || null,
                Date.now()
            );
        } catch (error) {
            console.error('Failed to upsert live rate limit in SQLite:', error.message);
        }
    }

    getAllLiveRateLimits() {
        try {
            return this.db.prepare('SELECT * FROM live_rate_limits').all();
        } catch (error) {
            console.error('Failed to get all live rate limits from SQLite:', error.message);
            return [];
        }
    }

    upsertPricing(modelName, promptPrice, completionPrice, rating) {
        try {
            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO model_pricing (model_name, prompt_price, completion_price, rating, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `);
            insert.run(modelName, promptPrice, completionPrice, rating, Date.now());
        } catch (error) {
            console.error('Failed to upsert pricing in SQLite:', error.message);
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

    updateUsage(providerId, requestsToday, requestsThisMinute) {
        try {
            const insert = this.db.prepare(`
                INSERT OR REPLACE INTO provider_usage (provider_id, requests_today, requests_this_minute, last_updated)
                VALUES (?, ?, ?, ?)
            `);
            insert.run(providerId, requestsToday, requestsThisMinute, Date.now());
        } catch (error) {
            console.error('Failed to update provider usage in SQLite:', error.message);
        }
    }

    getUsage(providerId) {
        try {
            const row = this.db.prepare('SELECT * FROM provider_usage WHERE provider_id = ?').get(providerId);
            return row ? { requestsToday: row.requests_today, requestsThisMinute: row.requests_this_minute } : null;
        } catch (error) {
            console.error('Failed to get provider usage from SQLite:', error.message);
            return null;
        }
    }

    logRequest({ providerId, modelName, status, latency, inputTokens, outputTokens, type, errorMessage = null }) {
        console.log("logRequest called:", { providerId, modelName, status, inputTokens, outputTokens });
        try {
            const insert = this.db.prepare(`
                INSERT INTO request_history (provider_id, model_name, status, latency, input_tokens, output_tokens, type, timestamp, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insert.run(providerId, modelName, status, latency, inputTokens, outputTokens, type, Date.now(), errorMessage);
        } catch (error) {
            console.error('Failed to log request in SQLite:', error.message);
        }
    }

    cleanupOldRecords(retentionDays = 60) {
        try {
            const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
            const result = this.db.prepare('DELETE FROM request_history WHERE timestamp < ?').run(cutoff);
            console.log(`Cleaned up ${result.changes} request history records older than ${retentionDays} days`);
        } catch (error) {
            console.error('Failed to cleanup old records:', error.message);
        }
    }

    getStats() {
        try {
            const totalRequests = this.db.prepare('SELECT COUNT(*) as count FROM request_history').get().count;
            const successRequests = this.db.prepare("SELECT COUNT(*) as count FROM request_history WHERE status = 'success'").get().count;
            const totalInputTokens = this.db.prepare('SELECT SUM(input_tokens) as count FROM request_history').get().count || 0;
            const totalOutputTokens = this.db.prepare('SELECT SUM(output_tokens) as count FROM request_history').get().count || 0;
            const avgLatency = this.db.prepare("SELECT AVG(latency) as avg FROM request_history WHERE status = 'success'").get().avg || 0;

            const providerStats = this.db.prepare(`
                SELECT 
                    provider_id, 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
                    AVG(latency) as avg_latency,
                    SUM(input_tokens) as total_input_tokens,
                    SUM(output_tokens) as total_output_tokens
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
                    SUM(input_tokens) as total_input_tokens,
                    SUM(output_tokens) as total_output_tokens
                FROM request_history 
                GROUP BY provider_id, model_name
            `).all();

            return {
                summary: {
                    totalRequests,
                    successRequests,
                    totalInputTokens,
                    totalOutputTokens,
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

    getStatsByTimeframe(timeframe) {
        try {
            const now = Date.now();
            let timeAgo = 0;
            if (timeframe === 'Daily') timeAgo = now - (24 * 60 * 60 * 1000);
            else if (timeframe === 'Weekly') timeAgo = now - (7 * 24 * 60 * 60 * 1000);
            else if (timeframe === 'Monthly') timeAgo = now - (30 * 24 * 60 * 60 * 1000);
            else return this.getStats();

            const query = `
                SELECT 
                    COUNT(*) as totalRequests,
                    SUM(input_tokens) as totalInputTokens,
                    SUM(output_tokens) as totalOutputTokens
                FROM request_history 
                WHERE timestamp > ?
            `;
            const stats = this.db.prepare(query).get(timeAgo);
            return {
                totalRequests: stats.totalRequests || 0,
                totalInputTokens: stats.totalInputTokens || 0,
                totalOutputTokens: stats.totalOutputTokens || 0
            };
        } catch (error) {
            console.error(`Failed to get stats for timeframe ${timeframe}:`, error.message);
            return { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0 };
        }
    }

    getHistory(limit = 100, offset = 0, filters = {}) {
        try {
            let query = 'SELECT * FROM request_history';
            let countQuery = 'SELECT COUNT(*) as count FROM request_history';
            const whereClauses = [];
            const params = [];

            if (filters.providerId) {
                whereClauses.push('provider_id LIKE ?');
                params.push(`%${filters.providerId}%`);
            }
            if (filters.modelName) {
                whereClauses.push('model_name LIKE ?');
                params.push(`%${filters.modelName}%`);
            }
            if (filters.status) {
                whereClauses.push('status = ?');
                params.push(filters.status);
            }

            if (whereClauses.length > 0) {
                const whereClause = ' WHERE ' + whereClauses.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            const validSortFields = ['timestamp', 'latency', 'input_tokens', 'output_tokens', 'provider_id', 'model_name'];
            const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'timestamp';
            const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

            query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            const dataParams = [...params, limit, offset];
            
            const data = this.db.prepare(query).all(...dataParams);
            const total = this.db.prepare(countQuery).get(...params).count;

            return { data, total };
        } catch (error) {
            console.error('Failed to get history from SQLite:', error.message);
            return { data: [], total: 0 };
        }
    }

    fillTimeGaps(data, interval) {
        if (data.length < 2) return data;

        const result = [];
        const dataMap = new Map(data.map(d => [d.label, d]));
        const labels = data.map(d => d.label);

        let current = new Date(labels[0]);
        const end = new Date(labels[labels.length - 1]);

        const increments = {
            minute: () => current.setMinutes(current.getMinutes() + 1),
            hour: () => current.setHours(current.getHours() + 1),
            day: () => current.setDate(current.getDate() + 1),
            month: () => current.setMonth(current.getMonth() + 1)
        };

        const step = increments[interval] || increments.day;

        const formatFns = {
            minute: () => {
                const mm = String(current.getMinutes()).padStart(2, '0');
                return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${mm}`;
            },
            hour: () => {
                return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:00`;
            },
            day: () => {
                return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            },
            month: () => {
                return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            }
        };
        const format = formatFns[interval] || formatFns.day;

        while (current <= end) {
            const label = format();
            if (dataMap.has(label)) {
                result.push(dataMap.get(label));
            } else {
                result.push({ label, value: 0 });
            }
            step();
        }

        return result;
    }

    getTimeSeriesStats(interval = 'day', metric = 'requests', filters = {}) {
        try {
            let dateFormat = '%Y-%m-%d';
            if (interval === 'minute') dateFormat = '%Y-%m-%d %H:%M';
            if (interval === 'hour') dateFormat = '%Y-%m-%d %H:00';
            if (interval === 'month') dateFormat = '%Y-%m';

            let valueExpr = 'COUNT(*)';
            if (metric === 'tokens') valueExpr = 'SUM(COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0))';
            if (metric === 'latency') valueExpr = 'AVG(latency)';

            let query = `
                SELECT 
                    strftime(?, timestamp / 1000, 'unixepoch', 'localtime') as label,
                    ${valueExpr} as value
                FROM request_history
            `;

            const whereClauses = [];
            const params = [dateFormat];

            if (metric === 'latency') {
                whereClauses.push("status = 'success'");
            }
            if (filters.providerId) {
                whereClauses.push('provider_id = ?');
                params.push(filters.providerId);
            }
            if (filters.modelName) {
                whereClauses.push('model_name = ?');
                params.push(filters.modelName);
            }

            if (whereClauses.length > 0) {
                query += ' WHERE ' + whereClauses.join(' AND ');
            }

            query += ' GROUP BY label ORDER BY label ASC';
            
            // Limit to reasonable amount of points
            if (interval === 'minute') query += ' LIMIT 60';
            else if (interval === 'hour') query += ' LIMIT 48';
            else if (interval === 'day') query += ' LIMIT 60';
            else if (interval === 'month') query += ' LIMIT 24';

            const data = this.db.prepare(query).all(...params);
            return this.fillTimeGaps(data, interval);
        } catch (error) {
            console.error('Failed to get time series stats:', error.message);
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
}

export default new StatusPersistence();
